import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { NotFoundError } from '@/lib/utils/errors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    const appointmentId = parseInt(id);

    const result = await query(
      `SELECT a.*, s.name as service_name, s.description as service_description
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       WHERE a.id = $1 AND a.user_id = $2`,
      [appointmentId, user.id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Appointment not found');
    }

    const row = result.rows[0];
    const appointment = {
      id: row.id,
      userId: row.user_id,
      dentistId: row.dentist_id,
      serviceId: row.service_id,
      serviceName: row.service_name,
      serviceDescription: row.service_description,
      appointmentDate: row.appointment_date,
      appointmentTime: row.appointment_time,
      duration: row.duration,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    const response = NextResponse.json({
      success: true,
      data: { appointment },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointment' },
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
    const { id } = await params;
    const appointmentId = parseInt(id);
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || null;

    // Check if appointment exists and belongs to user
    const checkResult = await query(
      'SELECT id, status FROM appointments WHERE id = $1 AND user_id = $2',
      [appointmentId, user.id]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Appointment not found');
    }

    // Soft delete - mark as cancelled
    await query(
      `UPDATE appointments 
       SET status = 'cancelled', notes = COALESCE(notes || E'\\nCancellation reason: ' || $1, $1)
       WHERE id = $2`,
      [reason, appointmentId]
    );

    logger.info('Appointment cancelled', { appointmentId, userId: user.id });

    const response = NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    logger.error('Cancel appointment error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}

