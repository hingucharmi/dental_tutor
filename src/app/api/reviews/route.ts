import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const reviewSchema = z.object({
  appointmentId: z.number().optional(),
  dentistId: z.number().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const data = reviewSchema.parse(body);

    // Verify appointment belongs to user if provided
    if (data.appointmentId) {
      const appointmentCheck = await query(
        'SELECT id FROM appointments WHERE id = $1 AND user_id = $2',
        [data.appointmentId, user.id]
      );

      if (appointmentCheck.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Appointment not found' },
          { status: 404 }
        );
      }
    }

    const result = await query(
      `INSERT INTO reviews 
       (user_id, appointment_id, dentist_id, rating, comment, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [
        user.id,
        data.appointmentId || null,
        data.dentistId || null,
        data.rating,
        data.comment || null,
      ]
    );

    logger.info('Review created', { id: result.rows[0].id, userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: { review: result.rows[0] },
    }, { status: 201 });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    logger.error('Create review error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dentistId = searchParams.get('dentistId');
    const status = searchParams.get('status') || 'approved';

    let queryStr = `
      SELECT r.*, u.first_name, u.last_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.status = $1
    `;
    const params: any[] = [status];

    if (dentistId) {
      queryStr += ' AND r.dentist_id = $2';
      params.push(parseInt(dentistId));
    }

    queryStr += ' ORDER BY r.created_at DESC LIMIT 50';

    const result = await query(queryStr, params);

    const response = NextResponse.json({
      success: true,
      data: { reviews: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

