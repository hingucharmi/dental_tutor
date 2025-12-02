import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const urgentAppointmentSchema = z.object({
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  serviceId: z.number().optional(),
  urgencyReason: z.string().min(1),
  symptoms: z.string().optional(),
});

function calculatePriorityScore(urgencyReason: string, symptoms?: string): number {
  let score = 50; // Base score for urgent requests

  const reason = urgencyReason.toLowerCase();
  const symptomText = symptoms?.toLowerCase() || '';

  // High priority indicators
  if (reason.includes('severe') || reason.includes('extreme') || reason.includes('emergency')) {
    score += 30;
  }
  if (reason.includes('bleeding') || reason.includes('trauma') || reason.includes('injury')) {
    score += 25;
  }
  if (symptomText.includes('fever') || symptomText.includes('swelling') || symptomText.includes('infection')) {
    score += 20;
  }
  if (reason.includes('pain') && (reason.includes('severe') || reason.includes('unbearable'))) {
    score += 15;
  }

  return Math.min(score, 100);
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const data = urgentAppointmentSchema.parse(body);

    const priorityScore = calculatePriorityScore(data.urgencyReason, data.symptoms);

    const result = await query(
      `INSERT INTO urgent_appointments 
       (user_id, preferred_date, preferred_time, service_id, urgency_reason, symptoms, priority_score, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [
        user.id,
        data.preferredDate || null,
        data.preferredTime || null,
        data.serviceId || null,
        data.urgencyReason,
        data.symptoms || null,
        priorityScore,
      ]
    );

    logger.info('Urgent appointment requested', { id: result.rows[0].id, userId: user.id, priorityScore });

    const response = NextResponse.json({
      success: true,
      data: { urgentAppointment: result.rows[0] },
    }, { status: 201 });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    logger.error('Create urgent appointment error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to create urgent appointment request' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let queryStr = `
      SELECT ua.*, s.name as service_name
      FROM urgent_appointments ua
      LEFT JOIN services s ON ua.service_id = s.id
      WHERE ua.user_id = $1
    `;
    const params: any[] = [user.id];

    if (status) {
      queryStr += ' AND ua.status = $2';
      params.push(status);
    }

    queryStr += ' ORDER BY ua.priority_score DESC, ua.created_at DESC';

    const result = await query(queryStr, params);

    const response = NextResponse.json({
      success: true,
      data: { urgentAppointments: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch urgent appointments' },
      { status: 500 }
    );
  }
}

