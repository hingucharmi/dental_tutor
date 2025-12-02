import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const referralSchema = z.object({
  appointmentId: z.number().optional(),
  referringDentistId: z.number().optional(),
  specialistName: z.string().min(1),
  specialistType: z.string().min(1),
  reason: z.string().min(1),
  urgency: z.enum(['normal', 'urgent', 'emergency']).optional(),
  notes: z.string().optional(),
});

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const data = referralSchema.parse(body);

    // Verify appointment belongs to user if provided
    if (data.appointmentId) {
      const appointmentCheck = await query(
        'SELECT id FROM appointments WHERE id = $1 AND user_id = $2',
        [data.appointmentId, user.id]
      );

      if (appointmentCheck.rows.length === 0) {
        const errorResponse = NextResponse.json(
          { success: false, error: 'Appointment not found' },
          { status: 404 }
        );
        return addCorsHeaders(errorResponse, req);
      }
    }

    const result = await query(
      `INSERT INTO referrals 
       (user_id, appointment_id, referring_dentist_id, specialist_name, specialist_type, 
        reason, urgency, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [
        user.id,
        data.appointmentId || null,
        data.referringDentistId || null,
        data.specialistName,
        data.specialistType,
        data.reason,
        data.urgency || 'normal',
        data.notes || null,
      ]
    );

    logger.info('Referral created', { id: result.rows[0].id, userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: { referral: result.rows[0] },
    }, { status: 201 });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorResponse = NextResponse.json(
        { 
          success: false, 
          error: error.errors[0].message,
          details: error.errors 
        },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    logger.error('Create referral error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to create referral' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let queryStr = `
      SELECT r.*, 
       CONCAT(u.first_name, ' ', u.last_name) as referring_dentist_name,
       a.appointment_date, a.appointment_time
      FROM referrals r
      LEFT JOIN dentists d ON r.referring_dentist_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN appointments a ON r.appointment_id = a.id
      WHERE r.user_id = $1
    `;
    const params: any[] = [user.id];

    if (status) {
      queryStr += ' AND r.status = $2';
      params.push(status);
    }

    queryStr += ' ORDER BY r.created_at DESC';

    const result = await query(queryStr, params);

    const response = NextResponse.json({
      success: true,
      data: { referrals: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Get referrals error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch referrals' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

