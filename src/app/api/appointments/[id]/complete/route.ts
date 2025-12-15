import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { AuthenticationError, NotFoundError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    const appointmentId = parseInt(id);

    const isAdmin = user.role === 'admin' || user.role === 'staff';
    const isDentist = user.role === 'dentist';

    if (!isAdmin && !isDentist) {
      throw new AuthenticationError('Insufficient permissions to complete appointment');
    }

    const existing = await query(
      'SELECT id, user_id, dentist_id, status FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (existing.rows.length === 0) {
      throw new NotFoundError('Appointment not found');
    }

    const appointment = existing.rows[0];

    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Cancelled appointments cannot be completed' },
        { status: 400 }
      );
    }

    if (appointment.status === 'completed') {
      const response = NextResponse.json({
        success: true,
        data: { appointment: { id: appointment.id, status: appointment.status } },
        message: 'Appointment already completed',
      });
      return addCorsHeaders(response, req);
    }

    if (isDentist && appointment.dentist_id && appointment.dentist_id !== user.id) {
      throw new AuthenticationError('You can only complete appointments assigned to you');
    }

    const result = await query(
      `UPDATE appointments 
       SET status = 'completed',
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, user_id, dentist_id, service_id, appointment_date, appointment_time, duration, status, notes, updated_at`,
      [appointmentId]
    );

    const updated = result.rows[0];

    logger.info('Appointment marked completed', {
      appointmentId,
      byUserId: user.id,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        appointment: {
          id: updated.id,
          userId: updated.user_id,
          dentistId: updated.dentist_id,
          serviceId: updated.service_id,
          appointmentDate: updated.appointment_date,
          appointmentTime: updated.appointment_time,
          duration: updated.duration,
          status: updated.status,
          notes: updated.notes,
          updatedAt: updated.updated_at,
        },
      },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    logger.error('Error completing appointment', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete appointment' },
      { status: 500 }
    );
  }
}

