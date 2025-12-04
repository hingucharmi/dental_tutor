import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { logger } from '@/lib/utils/logger';
import { NotFoundError } from '@/lib/utils/errors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    const complianceId = parseInt(id);
    const body = await req.json();
    const { status, notes } = body;

    // Check if compliance item exists and belongs to user
    const checkResult = await query(
      'SELECT id FROM treatment_compliance WHERE id = $1 AND user_id = $2',
      [complianceId, user.id]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Compliance item not found');
    }

    // Update compliance item
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (status) {
      updateFields.push(`compliance_status = $${paramIndex++}`);
      updateValues.push(status);
      
      if (status === 'completed') {
        updateFields.push(`completed_date = CURRENT_DATE`);
      }
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      updateValues.push(notes);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(complianceId);

    const updateQuery = `
      UPDATE treatment_compliance
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);

    logger.info('Compliance item updated', { complianceId, userId: user.id, status });

    const complianceItem = result.rows[0];
    const response = NextResponse.json({
      success: true,
      data: {
        complianceItem: {
          id: complianceItem.id,
          status: complianceItem.compliance_status,
          completedDate: complianceItem.completed_date,
          notes: complianceItem.notes,
        },
      },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    logger.error('Update compliance error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to update compliance item' },
      { status: 500 }
    );
  }
}

