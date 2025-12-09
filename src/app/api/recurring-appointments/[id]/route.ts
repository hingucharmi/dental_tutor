import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { NotFoundError } from '@/lib/utils/errors';
import { notifyRecurringAppointmentUpdated, notifyRecurringAppointmentDeleted } from '@/lib/services/notifications';

const updateSchema = z.object({
  status: z.enum(['active', 'paused', 'cancelled']).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional(),
});

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    
    // Only doctors/admin/staff can update recurring appointments
    const isStaff = user.role === 'admin' || user.role === 'staff' || user.role === 'dentist';
    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: 'Only doctors can modify recurring appointments' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const recurringId = parseInt(id);
    const body = await req.json();
    const data = updateSchema.parse(body);

    // Verify the recurring appointment exists
    const checkResult = await query(
      'SELECT id FROM recurring_appointments WHERE id = $1',
      [recurringId]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Recurring appointment not found');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.endDate) {
      updates.push(`end_date = $${paramIndex++}`);
      values.push(data.endDate);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(data.notes);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(recurringId);
    const result = await query(
      `UPDATE recurring_appointments 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    logger.info('Recurring appointment updated', { id: recurringId, userId: user.id });

    // Create notification for the patient
    try {
      const updatedAppointment = result.rows[0];
      
      // Get service name if service_id exists
      let serviceName = null;
      if (updatedAppointment.service_id) {
        const serviceResult = await query('SELECT name FROM services WHERE id = $1', [updatedAppointment.service_id]);
        if (serviceResult.rows.length > 0) {
          serviceName = serviceResult.rows[0].name;
        }
      }

      await notifyRecurringAppointmentUpdated(updatedAppointment.user_id, {
        serviceName,
        recurrencePattern: updatedAppointment.recurrence_pattern,
        status: data.status,
      });
    } catch (notifError) {
      logger.error('Failed to create notification', notifError as Error);
      // Don't fail the request if notification fails
    }

    const response = NextResponse.json({
      success: true,
      data: { recurringAppointment: result.rows[0] },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    logger.error('Update recurring appointment error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to update recurring appointment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    
    // Only doctors/admin/staff can delete recurring appointments
    const isStaff = user.role === 'admin' || user.role === 'staff' || user.role === 'dentist';
    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: 'Only doctors can delete recurring appointments' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const recurringId = parseInt(id);

    // Get appointment details before deletion for notification
    const appointmentResult = await query(
      'SELECT ra.*, s.name as service_name FROM recurring_appointments ra LEFT JOIN services s ON ra.service_id = s.id WHERE ra.id = $1',
      [recurringId]
    );

    if (appointmentResult.rows.length === 0) {
      throw new NotFoundError('Recurring appointment not found');
    }

    const appointmentToDelete = appointmentResult.rows[0];

    // Actually delete the record from database
    const deleteResult = await query(
      'DELETE FROM recurring_appointments WHERE id = $1 RETURNING id',
      [recurringId]
    );

    if (deleteResult.rows.length === 0) {
      throw new NotFoundError('Recurring appointment not found or already deleted');
    }

    logger.info('Recurring appointment deleted', { id: recurringId, userId: user.id });

    // Create notification for the patient
    try {
      await notifyRecurringAppointmentDeleted(appointmentToDelete.user_id, {
        serviceName: appointmentToDelete.service_name,
        recurrencePattern: appointmentToDelete.recurrence_pattern,
      });
    } catch (notifError) {
      logger.error('Failed to create notification', notifError as Error);
      // Don't fail the request if notification fails
    }

    const response = NextResponse.json({
      success: true,
      message: 'Recurring appointment deleted successfully',
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    logger.error('Delete recurring appointment error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete recurring appointment' },
      { status: 500 }
    );
  }
}

