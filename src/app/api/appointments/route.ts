import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { AuthenticationError } from '@/lib/utils/errors';

const createAppointmentSchema = z.object({
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD'),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format. Expected HH:MM'),
  serviceId: z.number().int().positive('Service ID must be a positive number').optional(),
  dentistId: z.number().int().positive('Dentist ID must be a positive number').optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
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
    
    // Log the incoming request for debugging
    logger.info('Creating appointment', { body, userId: user.id });
    
    let data;
    try {
      data = createAppointmentSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessages = validationError.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        logger.error('Validation error', { errors: validationError.errors, body });
        return NextResponse.json(
          { success: false, error: `Validation failed: ${errorMessages}`, details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Check if user already has an appointment for the same service on the same day
    if (data.serviceId) {
      const duplicateAppointment = await query(
        `SELECT id FROM appointments 
         WHERE user_id = $1 
         AND service_id = $2 
         AND appointment_date = $3 
         AND status != 'cancelled'`,
        [user.id, data.serviceId, data.appointmentDate]
      );

      if (duplicateAppointment.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: 'You already have an appointment for this treatment on this date. Please choose a different date or treatment.' },
          { status: 400 }
        );
      }
    }

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

    logger.info('Appointment created', { 
      appointmentId: appointment.id, 
      userId: user.id,
      appointmentDate: appointment.appointment_date,
      appointmentTime: appointment.appointment_time,
      status: appointment.status
    });

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
    logger.error('Create appointment error', error as Error);
    
    // Return more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to create appointment';
    const statusCode = error instanceof z.ZodError ? 400 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error instanceof z.ZodError ? error.errors : undefined
      },
      { status: statusCode }
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

    // Optimized query with proper indexing
    let queryStr = `
      SELECT a.id, a.user_id, a.dentist_id, a.service_id, 
             a.appointment_date, a.appointment_time, a.duration, 
             a.status, a.notes, a.created_at, a.updated_at,
             s.name as service_name, s.description as service_description
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.user_id = $1
    `;
    const params: any[] = [user.id];

    if (status) {
      queryStr += ' AND a.status = $2';
      params.push(status);
    }

    queryStr += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC 
                  LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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

