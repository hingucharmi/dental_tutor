import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const updateReferralSchema = z.object({
  status: z.enum(['pending', 'sent', 'accepted', 'completed', 'cancelled']).optional(),
  notes: z.string().optional(),
});

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    const referralId = parseInt(id);

    if (isNaN(referralId)) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Invalid referral ID' },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    const result = await query(
      `SELECT r.*, 
       CONCAT(u.first_name, ' ', u.last_name) as referring_dentist_name,
       a.appointment_date, a.appointment_time
      FROM referrals r
      LEFT JOIN dentists d ON r.referring_dentist_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN appointments a ON r.appointment_id = a.id
      WHERE r.id = $1 AND r.user_id = $2`,
      [referralId, user.id]
    );

    if (result.rows.length === 0) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Referral not found' },
        { status: 404 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    const response = NextResponse.json({
      success: true,
      data: { referral: result.rows[0] },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Get referral error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch referral' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    const referralId = parseInt(id);
    const body = await req.json();
    const data = updateReferralSchema.parse(body);

    if (isNaN(referralId)) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Invalid referral ID' },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    // Verify ownership
    const checkResult = await query(
      'SELECT id FROM referrals WHERE id = $1 AND user_id = $2',
      [referralId, user.id]
    );

    if (checkResult.rows.length === 0) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Referral not found' },
        { status: 404 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(data.notes);
    }

    if (updates.length === 0) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(referralId, user.id);

    const updateQuery = `
      UPDATE referrals 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    logger.info('Referral updated', { id: referralId, userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: { referral: result.rows[0] },
    });

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

    logger.error('Update referral error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to update referral' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

