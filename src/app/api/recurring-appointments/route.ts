import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const recurringAppointmentSchema = z.object({
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
    const body = await req.json();
    const data = recurringAppointmentSchema.parse(body);

    const result = await query(
      `INSERT INTO recurring_appointments 
       (user_id, service_id, dentist_id, recurrence_pattern, recurrence_interval, 
        day_of_week, day_of_month, start_date, end_date, time_slot, duration, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
       RETURNING *`,
      [
        user.id,
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

    const result = await query(
      `SELECT ra.*, s.name as service_name
       FROM recurring_appointments ra
       LEFT JOIN services s ON ra.service_id = s.id
       WHERE ra.user_id = $1 AND ra.status = $2
       ORDER BY ra.start_date ASC`,
      [user.id, status]
    );

    const response = NextResponse.json({
      success: true,
      data: { recurringAppointments: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    logger.error('Get recurring appointments error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recurring appointments' },
      { status: 500 }
    );
  }
}

