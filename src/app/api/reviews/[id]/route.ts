import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
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
    const { id } = await params;
    const reviewId = parseInt(id);

    if (isNaN(reviewId)) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Invalid review ID' },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    const result = await query(
      `SELECT r.*, u.first_name, u.last_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [reviewId]
    );

    if (result.rows.length === 0) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    const response = NextResponse.json({
      success: true,
      data: { review: result.rows[0] },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Get review error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch review' },
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
    const reviewId = parseInt(id);
    const body = await req.json();
    const data = updateReviewSchema.parse(body);

    if (isNaN(reviewId)) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Invalid review ID' },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    // Verify ownership (users can only update their own reviews, unless updating status)
    const checkResult = await query(
      'SELECT user_id, status FROM reviews WHERE id = $1',
      [reviewId]
    );

    if (checkResult.rows.length === 0) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    const review = checkResult.rows[0];
    const isOwner = review.user_id === user.id;
    const isUpdatingStatus = data.status !== undefined;

    // Only allow status updates for admins/owners, or content updates for owners
    if (isUpdatingStatus && !isOwner) {
      // Check if user is admin (you may need to add role check)
      // For now, allow status update only by owner
      const errorResponse = NextResponse.json(
        { success: false, error: 'Unauthorized to update review status' },
        { status: 403 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    if (!isUpdatingStatus && !isOwner) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Unauthorized to update this review' },
        { status: 403 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.rating !== undefined) {
      updates.push(`rating = $${paramIndex++}`);
      values.push(data.rating);
    }
    if (data.comment !== undefined) {
      updates.push(`comment = $${paramIndex++}`);
      values.push(data.comment);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
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

    // Add WHERE clause parameter
    values.push(reviewId);

    const updateQuery = `
      UPDATE reviews 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    logger.info('Review updated', { id: reviewId, userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: { review: result.rows[0] },
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

    logger.error('Update review error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to update review' },
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
    const reviewId = parseInt(id);

    if (isNaN(reviewId)) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Invalid review ID' },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    // Verify ownership
    const checkResult = await query(
      'SELECT user_id FROM reviews WHERE id = $1',
      [reviewId]
    );

    if (checkResult.rows.length === 0) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    if (checkResult.rows[0].user_id !== user.id) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Unauthorized to delete this review' },
        { status: 403 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    const result = await query(
      'DELETE FROM reviews WHERE id = $1 RETURNING *',
      [reviewId]
    );

    logger.info('Review deleted', { id: reviewId, userId: user.id });

    const response = NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
      data: { review: result.rows[0] },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Delete review error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete review' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

