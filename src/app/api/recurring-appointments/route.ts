import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { notifyRecurringAppointmentCreated } from '@/lib/services/notifications';

const recurringAppointmentSchema = z.object({
  userId: z.number().optional(), // For doctors/admin/staff to create for patients
  serviceId: z.number().optional(),
  dentistId: z.number().optional(),
  recurrencePattern: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  recurrenceInterval: z.number().min(1).default(1),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
  duration: z.number().default(30),
  notes: z.string().optional(),
});

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    
    // Only doctors/admin/staff can create recurring appointments
    const isStaff = user.role === 'admin' || user.role === 'staff' || user.role === 'dentist';
    if (!isStaff) {
      return NextResponse.json(
        { success: false, error: 'Only doctors can create recurring appointments. Please contact your dentist to set up recurring appointments.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = recurringAppointmentSchema.parse(body);

    // Determine target user ID - staff must specify a patient
    const targetUserId = data.userId;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Verify the target user exists and is a patient
    const targetUser = await query(
      'SELECT id, role FROM users WHERE id = $1',
      [targetUserId]
    );
    if (targetUser.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }
    if (targetUser.rows[0].role !== 'patient' && targetUser.rows[0].role !== null) {
      return NextResponse.json(
        { success: false, error: 'Can only create recurring appointments for patients' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO recurring_appointments 
       (user_id, service_id, dentist_id, recurrence_pattern, recurrence_interval, 
        day_of_week, day_of_month, start_date, end_date, time_slot, duration, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
       RETURNING *`,
      [
        targetUserId,
        data.serviceId || null,
        data.dentistId || null,
        data.recurrencePattern,
        data.recurrenceInterval,
        data.dayOfWeek || null,
        data.dayOfMonth || null,
        data.startDate,
        data.endDate || null,
        data.timeSlot || '09:00', // Default to 9:00 AM if not provided
        data.duration,
        data.notes || null,
      ]
    );

    logger.info('Recurring appointment created', { id: result.rows[0].id, userId: user.id });

    // Create notification for the patient
    try {
      // Get service name if service_id exists
      let serviceName = null;
      if (data.serviceId) {
        const serviceResult = await query('SELECT name FROM services WHERE id = $1', [data.serviceId]);
        if (serviceResult.rows.length > 0) {
          serviceName = serviceResult.rows[0].name;
        }
      }

      await notifyRecurringAppointmentCreated(targetUserId, {
        serviceName,
        recurrencePattern: data.recurrencePattern,
        startDate: data.startDate,
        timeSlot: data.timeSlot || '09:00',
      });
    } catch (notifError) {
      logger.error('Failed to create notification', notifError as Error);
      // Don't fail the request if notification fails
    }

    const response = NextResponse.json({
      success: true,
      data: { recurringAppointment: result.rows[0] },
    }, { status: 201 });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    // Check for database column errors
    if (error?.code === '42703' || error?.message?.includes('does not exist')) {
      logger.error('Database schema error', error as Error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database table structure issue. Please run: npm run db:create-recurring-table' 
        },
        { status: 500 }
      );
    }

    logger.error('Create recurring appointment error', error as Error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to create recurring appointment',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'active';
    const patientId = searchParams.get('patientId'); // For doctors to filter by patient

    // Doctors/admin/staff can see all recurring appointments, patients only see their own
    const isStaff = user.role === 'admin' || user.role === 'staff' || user.role === 'dentist';
    
    let queryStr = `
      SELECT ra.*, s.name as service_name,
             u.first_name, u.last_name, u.email
      FROM recurring_appointments ra
      LEFT JOIN services s ON ra.service_id = s.id
      LEFT JOIN users u ON ra.user_id = u.id
      WHERE ra.status = $1
    `;
    const params: any[] = [status];

    if (isStaff) {
      // Staff can see all, optionally filtered by patientId
      if (patientId) {
        queryStr += ' AND ra.user_id = $2';
        params.push(parseInt(patientId));
      }
    } else {
      // Patients only see their own
      queryStr += ' AND ra.user_id = $2';
      params.push(user.id);
    }

    queryStr += ' ORDER BY ra.start_date ASC';

    const result = await query(queryStr, params);

    const response = NextResponse.json({
      success: true,
      data: { recurringAppointments: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Get recurring appointments error', error as Error);
    
    // Check for database table/column errors
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database table not found. Please run: npm run db:migrate',
          details: process.env.NODE_ENV === 'development' ? error?.message : undefined
        },
        { status: 500 }
      );
    }

    if (error?.code === '42703' || error?.message?.includes('column') && error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database schema issue. Please run: npm run db:migrate',
          details: process.env.NODE_ENV === 'development' ? error?.message : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to fetch recurring appointments',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

