import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { NotFoundError } from '@/lib/utils/errors';

const rescheduleSchema = z.object({
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
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
    const { id } = await params;
    const appointmentId = parseInt(id);
    const body = await req.json();
    const { appointmentDate, appointmentTime } = rescheduleSchema.parse(body);

    // Check if appointment exists and belongs to user
    const checkResult = await query(
      'SELECT id, status FROM appointments WHERE id = $1 AND user_id = $2',
      [appointmentId, user.id]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Appointment not found');
    }

    if (checkResult.rows[0].status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Cannot reschedule a cancelled appointment' },
        { status: 400 }
      );
    }

    // Check if new slot is available
    const existingAppointment = await query(
      `SELECT id FROM appointments 
       WHERE appointment_date = $1 
       AND appointment_time = $2 
       AND status != 'cancelled'
       AND id != $3`,
      [appointmentDate, appointmentTime, appointmentId]
    );

    if (existingAppointment.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'This time slot is already booked' },
        { status: 400 }
      );
    }

    // Update appointment
    const result = await query(
      `UPDATE appointments 
       SET appointment_date = $1, appointment_time = $2, status = 'rescheduled'
       WHERE id = $3
       RETURNING id, appointment_date, appointment_time, status`,
      [appointmentDate, appointmentTime, appointmentId]
    );

    logger.info('Appointment rescheduled', { appointmentId, userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: {
        appointment: {
          id: result.rows[0].id,
          appointmentDate: result.rows[0].appointment_date,
          appointmentTime: result.rows[0].appointment_time,
          status: result.rows[0].status,
        },
      },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    logger.error('Reschedule appointment error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to reschedule appointment' },
      { status: 500 }
    );
  }
}

