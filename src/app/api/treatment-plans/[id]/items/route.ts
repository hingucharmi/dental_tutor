import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { NotFoundError } from '@/lib/utils/errors';

const itemSchema = z.object({
  serviceId: z.union([z.number(), z.string()]).transform((val) => {
    if (val === undefined || val === null) return undefined;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return isNaN(num) ? undefined : num;
  }).optional(),
  description: z.string().min(1, 'Description is required'),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  orderIndex: z.number().default(0),
});

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(req);
    const planId = parseInt(params.id);
    const body = await req.json();
    const data = itemSchema.parse(body);

    // First check if plan exists at all
    const planExists = await query(
      'SELECT id, user_id FROM treatment_plans WHERE id = $1',
      [planId]
    );

    if (planExists.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Treatment plan not found',
          details: `No treatment plan found with ID ${planId}`
        },
        { status: 404 }
      );
    }

    // Check if plan belongs to user
    if (planExists.rows[0].user_id !== user.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Treatment plan not found',
          details: 'This treatment plan does not belong to your account'
        },
        { status: 404 }
      );
    }

    const status = data.status || 'pending';

    // Check which columns exist in the table
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'treatment_plan_items' 
      AND column_name IN ('item_name', 'description')
    `);
    
    const hasItemName = columnCheck.rows.some((row: any) => row.column_name === 'item_name');
    const hasDescription = columnCheck.rows.some((row: any) => row.column_name === 'description');

    let insertQuery: string;
    let insertParams: any[];

    if (hasItemName && hasDescription) {
      // Table has both columns - use both
      insertQuery = `INSERT INTO treatment_plan_items 
       (treatment_plan_id, service_id, item_name, description, scheduled_date, order_index, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`;
      insertParams = [
        planId,
        data.serviceId || null,
        data.description, // Use description as item_name
        data.description, // Also set description
        data.scheduledDate || null,
        data.orderIndex,
        status,
      ];
    } else if (hasItemName) {
      // Table only has item_name
      insertQuery = `INSERT INTO treatment_plan_items 
       (treatment_plan_id, service_id, item_name, scheduled_date, order_index, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`;
      insertParams = [
        planId,
        data.serviceId || null,
        data.description, // Use description as item_name
        data.scheduledDate || null,
        data.orderIndex,
        status,
      ];
    } else {
      // Table only has description (as per migration)
      insertQuery = `INSERT INTO treatment_plan_items 
       (treatment_plan_id, service_id, description, scheduled_date, order_index, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`;
      insertParams = [
        planId,
        data.serviceId || null,
        data.description,
        data.scheduledDate || null,
        data.orderIndex,
        status,
      ];
    }

    const result = await query(insertQuery, insertParams);

    logger.info('Treatment plan item created', { id: result.rows[0].id, planId });

    const response = NextResponse.json({
      success: true,
      data: { item: result.rows[0] },
    }, { status: 201 });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: errorMessages,
          message: errorMessages[0]?.message || 'Invalid request data'
        },
        { status: 400 }
      );
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    logger.error('Create treatment plan item error', error as Error);
    const errorMessage = error?.message || 'Failed to create treatment plan item';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        code: error?.code
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(req);
    const planId = parseInt(params.id);

    // Verify plan ownership
    const planCheck = await query(
      'SELECT id FROM treatment_plans WHERE id = $1 AND user_id = $2',
      [planId, user.id]
    );

    if (planCheck.rows.length === 0) {
      throw new NotFoundError('Treatment plan not found');
    }

    const result = await query(
      `SELECT tpi.*, s.name as service_name
       FROM treatment_plan_items tpi
       LEFT JOIN services s ON tpi.service_id = s.id
       WHERE tpi.treatment_plan_id = $1
       ORDER BY tpi.order_index ASC, tpi.id ASC`,
      [planId]
    );

    const response = NextResponse.json({
      success: true,
      data: { items: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch treatment plan items' },
      { status: 500 }
    );
  }
}

