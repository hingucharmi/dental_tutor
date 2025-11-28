import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const waitlistSchema = z.object({
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format').optional(),
  serviceId: z.number().optional(),
  dentistId: z.number().optional(),
  autoBook: z.boolean().optional().default(false),
});

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const data = waitlistSchema.parse(body);

    // Check if user already has active waitlist entry for this date/service
    let existingWaitlist;
    try {
      if (data.serviceId) {
        existingWaitlist = await query(
          `SELECT id FROM waitlist 
           WHERE user_id = $1 
           AND preferred_date = $2 
           AND status = 'active'
           AND service_id = $3`,
          [user.id, data.preferredDate, data.serviceId]
        );
      } else {
        existingWaitlist = await query(
          `SELECT id FROM waitlist 
           WHERE user_id = $1 
           AND preferred_date = $2 
           AND status = 'active'`,
          [user.id, data.preferredDate]
        );
      }
    } catch (dbError: any) {
      // If table doesn't exist, provide helpful error message
      if (dbError.code === '42P01' || dbError.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Waitlist table does not exist. Please run database migrations first.',
            hint: 'Run: npm run db:migrate'
          },
          { status: 500 }
        );
      }
      throw dbError;
    }

    if (existingWaitlist.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'You already have an active waitlist entry for this date' },
        { status: 400 }
      );
    }

    // Create waitlist entry
    const result = await query(
      `INSERT INTO waitlist 
       (user_id, preferred_date, preferred_time, service_id, dentist_id, auto_book, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING id, user_id, preferred_date, preferred_time, service_id, dentist_id, status, auto_book, created_at`,
      [
        user.id,
        data.preferredDate,
        data.preferredTime || null,
        data.serviceId || null,
        data.dentistId || null,
        data.autoBook || false,
      ]
    );

    logger.info('Waitlist entry created', { waitlistId: result.rows[0].id, userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: {
        waitlist: {
          id: result.rows[0].id,
          userId: result.rows[0].user_id,
          preferredDate: result.rows[0].preferred_date,
          preferredTime: result.rows[0].preferred_time,
          serviceId: result.rows[0].service_id,
          dentistId: result.rows[0].dentist_id,
          status: result.rows[0].status,
          autoBook: result.rows[0].auto_book,
          createdAt: result.rows[0].created_at,
        },
      },
    }, { status: 201 });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    // Log the full error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Create waitlist error', { message: errorMessage, stack: errorStack });

    // Return detailed error in development, generic in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      { 
        success: false, 
        error: isDevelopment ? errorMessage : 'Failed to create waitlist entry',
        ...(isDevelopment && { details: errorStack })
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
      `SELECT w.*, s.name as service_name
       FROM waitlist w
       LEFT JOIN services s ON w.service_id = s.id
       WHERE w.user_id = $1 AND w.status = $2
       ORDER BY w.preferred_date ASC, w.created_at ASC`,
      [user.id, status]
    );

    const waitlistEntries = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      preferredDate: row.preferred_date,
      preferredTime: row.preferred_time,
      serviceId: row.service_id,
      serviceName: row.service_name,
      dentistId: row.dentist_id,
      status: row.status,
      autoBook: row.auto_book,
      notifiedAt: row.notified_at,
      createdAt: row.created_at,
    }));

    const response = NextResponse.json({
      success: true,
      data: { waitlist: waitlistEntries },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    logger.error('Get waitlist error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch waitlist' },
      { status: 500 }
    );
  }
}

