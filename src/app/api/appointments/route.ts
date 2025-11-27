import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { AuthenticationError } from '@/lib/utils/errors';

const createAppointmentSchema = z.object({
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  serviceId: z.number().optional(),
  dentistId: z.number().optional(),
  notes: z.string().optional(),
});

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    let user;
    try {
      user = requireAuth(req);
    } catch (authError) {
      if (authError instanceof AuthenticationError) {
        return NextResponse.json(
          { success: false, error: authError.message },
          { status: 401 }
        );
      }
      throw authError;
    }

    const body = await req.json();
    const data = createAppointmentSchema.parse(body);

    // Check if slot is available
    const existingAppointment = await query(
      `SELECT id FROM appointments 
       WHERE appointment_date = $1 
       AND appointment_time = $2 
       AND status != 'cancelled'
       ${data.dentistId ? 'AND dentist_id = $3' : ''}`,
      data.dentistId ? [data.appointmentDate, data.appointmentTime, data.dentistId] : [data.appointmentDate, data.appointmentTime]
    );

    if (existingAppointment.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'This time slot is already booked' },
        { status: 400 }
      );
    }

    // Get service duration if serviceId provided
    let duration = 30; // default
    if (data.serviceId) {
      const serviceResult = await query(
        'SELECT duration FROM services WHERE id = $1',
        [data.serviceId]
      );
      if (serviceResult.rows.length > 0) {
        duration = serviceResult.rows[0].duration;
      }
    }

    // Create appointment
    const result = await query(
      `INSERT INTO appointments 
       (user_id, dentist_id, service_id, appointment_date, appointment_time, duration, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', $7)
       RETURNING id, user_id, dentist_id, service_id, appointment_date, appointment_time, duration, status, notes, created_at`,
      [
        user.id,
        data.dentistId || null,
        data.serviceId || null,
        data.appointmentDate,
        data.appointmentTime,
        duration,
        data.notes || null,
      ]
    );

    const appointment = result.rows[0];

    logger.info('Appointment created', { appointmentId: appointment.id, userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: {
        appointment: {
          id: appointment.id,
          userId: appointment.user_id,
          dentistId: appointment.dentist_id,
          serviceId: appointment.service_id,
          appointmentDate: appointment.appointment_date,
          appointmentTime: appointment.appointment_time,
          duration: appointment.duration,
          status: appointment.status,
          notes: appointment.notes,
          createdAt: appointment.created_at,
        },
      },
    }, { status: 201 });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message, details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Create appointment error', error as Error);
    
    // Return more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to create appointment';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let queryStr = `
      SELECT a.*, s.name as service_name, s.description as service_description
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.user_id = $1
    `;
    const params: any[] = [user.id];

    if (status) {
      queryStr += ' AND a.status = $2';
      params.push(status);
    }

    queryStr += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await query(queryStr, params);

    const appointments = result.rows.map((row) => ({
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
    }));

    const response = NextResponse.json({
      success: true,
      data: { appointments },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    logger.error('Get appointments error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

