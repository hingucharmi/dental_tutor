import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { addCorsHeaders } from '@/lib/middleware/cors';

const feedbackSchema = z.object({
  appointmentId: z.number(),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  feedbackData: z.record(z.any()).optional(),
});

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const data = feedbackSchema.parse(body);

    // Verify appointment belongs to user
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

    // Create or update follow-up feedback
    const existingFollowUp = await query(
      'SELECT id FROM follow_ups WHERE appointment_id = $1',
      [data.appointmentId]
    );

    let result;
    if (existingFollowUp.rows.length > 0) {
      // Update existing follow-up
      result = await query(
        `UPDATE follow_ups 
         SET feedback_collected = TRUE, feedback_data = $1
         WHERE appointment_id = $2
         RETURNING *`,
        [JSON.stringify(data.feedbackData || { rating: data.rating, comment: data.comment }), data.appointmentId]
      );
    } else {
      // Create new follow-up
      result = await query(
        `INSERT INTO follow_ups 
         (appointment_id, user_id, follow_up_type, feedback_collected, feedback_data)
         VALUES ($1, $2, 'feedback', TRUE, $3)
         RETURNING *`,
        [
          data.appointmentId,
          user.id,
          JSON.stringify(data.feedbackData || { rating: data.rating, comment: data.comment }),
        ]
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        followUp: {
          id: result.rows[0].id,
          appointmentId: result.rows[0].appointment_id,
          feedbackCollected: result.rows[0].feedback_collected,
          feedbackData: result.rows[0].feedback_data,
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

    return NextResponse.json(
      { success: false, error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get('appointmentId');

    let queryStr = `
      SELECT f.*, a.appointment_date, a.appointment_time
      FROM follow_ups f
      JOIN appointments a ON f.appointment_id = a.id
      WHERE f.user_id = $1
    `;
    const params: any[] = [user.id];

    if (appointmentId) {
      queryStr += ' AND f.appointment_id = $2';
      params.push(parseInt(appointmentId));
    }

    queryStr += ' ORDER BY f.created_at DESC';

    const result = await query(queryStr, params);

    const followUps = result.rows.map((row) => ({
      id: row.id,
      appointmentId: row.appointment_id,
      appointmentDate: row.appointment_date,
      appointmentTime: row.appointment_time,
      followUpType: row.follow_up_type,
      message: row.message,
      sentAt: row.sent_at,
      feedbackCollected: row.feedback_collected,
      feedbackData: row.feedback_data,
      createdAt: row.created_at,
    }));

    const response = NextResponse.json({
      success: true,
      data: { followUps },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch follow-ups' },
      { status: 500 }
    );
  }
}

