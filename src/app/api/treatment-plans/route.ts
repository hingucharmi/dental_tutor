import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const treatmentPlanSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const data = treatmentPlanSchema.parse(body);

    const result = await query(
      `INSERT INTO treatment_plans 
       (user_id, title, description, start_date, end_date, status, progress_percentage)
       VALUES ($1, $2, $3, $4, $5, 'active', 0)
       RETURNING *`,
      [
        user.id,
        data.title,
        data.description || null,
        data.startDate || null,
        data.endDate || null,
      ]
    );

    logger.info('Treatment plan created', { id: result.rows[0].id, userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: { treatmentPlan: result.rows[0] },
    }, { status: 201 });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorResponse = NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    logger.error('Create treatment plan error', error as Error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to create treatment plan' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'active';

    const result = await query(
      `SELECT tp.*, 
       COUNT(tpi.id) as total_items,
       COUNT(CASE WHEN tpi.status = 'completed' THEN 1 END) as completed_items
       FROM treatment_plans tp
       LEFT JOIN treatment_plan_items tpi ON tp.id = tpi.treatment_plan_id
       WHERE tp.user_id = $1 AND tp.status = $2
       GROUP BY tp.id
       ORDER BY tp.start_date DESC`,
      [user.id, status]
    );

    const response = NextResponse.json({
      success: true,
      data: { treatmentPlans: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Get treatment plans error', error as Error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch treatment plans' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

