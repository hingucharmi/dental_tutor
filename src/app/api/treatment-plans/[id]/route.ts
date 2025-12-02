import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const updateTreatmentPlanSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['active', 'in_progress', 'completed', 'cancelled', 'on_hold']).optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
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
    const treatmentPlanId = parseInt(id);

    if (isNaN(treatmentPlanId)) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Invalid treatment plan ID' },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    const result = await query(
      `SELECT tp.*, 
       COUNT(tpi.id) as total_items,
       COUNT(CASE WHEN tpi.status = 'completed' THEN 1 END) as completed_items
       FROM treatment_plans tp
       LEFT JOIN treatment_plan_items tpi ON tp.id = tpi.treatment_plan_id
       WHERE tp.id = $1 AND tp.user_id = $2
       GROUP BY tp.id`,
      [treatmentPlanId, user.id]
    );

    if (result.rows.length === 0) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Treatment plan not found' },
        { status: 404 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    const response = NextResponse.json({
      success: true,
      data: { treatmentPlan: result.rows[0] },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Get treatment plan error', error);
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to fetch treatment plan' 
      },
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
    const treatmentPlanId = parseInt(id);
    const body = await req.json();
    const data = updateTreatmentPlanSchema.parse(body);

    if (isNaN(treatmentPlanId)) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Invalid treatment plan ID' },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    // Verify ownership
    const checkResult = await query(
      'SELECT id FROM treatment_plans WHERE id = $1 AND user_id = $2',
      [treatmentPlanId, user.id]
    );

    if (checkResult.rows.length === 0) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Treatment plan not found' },
        { status: 404 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.startDate !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      values.push(data.endDate);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.progressPercentage !== undefined) {
      updates.push(`progress_percentage = $${paramIndex++}`);
      values.push(data.progressPercentage);
    }

    if (updates.length === 0) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    // Add updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add WHERE clause parameters
    values.push(treatmentPlanId, user.id);

    const updateQuery = `
      UPDATE treatment_plans 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    logger.info('Treatment plan updated', { id: treatmentPlanId, userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: { treatmentPlan: result.rows[0] },
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

    logger.error('Update treatment plan error', error);
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to update treatment plan' 
      },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    const treatmentPlanId = parseInt(id);

    if (isNaN(treatmentPlanId)) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Invalid treatment plan ID' },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    // Verify ownership
    const checkResult = await query(
      'SELECT id FROM treatment_plans WHERE id = $1 AND user_id = $2',
      [treatmentPlanId, user.id]
    );

    if (checkResult.rows.length === 0) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Treatment plan not found' },
        { status: 404 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    // Soft delete by updating status
    const result = await query(
      `UPDATE treatment_plans 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [treatmentPlanId, user.id]
    );

    logger.info('Treatment plan deleted', { id: treatmentPlanId, userId: user.id });

    const response = NextResponse.json({
      success: true,
      message: 'Treatment plan deleted successfully',
      data: { treatmentPlan: result.rows[0] },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Delete treatment plan error', error);
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to delete treatment plan' 
      },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

