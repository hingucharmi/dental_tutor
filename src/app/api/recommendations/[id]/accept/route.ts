import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    const recommendationId = parseInt(id);

    if (isNaN(recommendationId)) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Invalid recommendation ID' },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    // Verify ownership
    const checkResult = await query(
      'SELECT id FROM recommendations WHERE id = $1 AND user_id = $2',
      [recommendationId, user.id]
    );

    if (checkResult.rows.length === 0) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Recommendation not found' },
        { status: 404 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    const result = await query(
      `UPDATE recommendations 
       SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [recommendationId, user.id]
    );

    logger.info('Recommendation accepted', { id: recommendationId, userId: user.id });

    const response = NextResponse.json({
      success: true,
      message: 'Recommendation accepted',
      data: { recommendation: result.rows[0] },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Accept recommendation error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to accept recommendation' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

