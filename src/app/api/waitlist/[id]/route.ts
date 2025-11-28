import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { NotFoundError } from '@/lib/utils/errors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(req);
    const waitlistId = parseInt(params.id);

    // Check if waitlist entry exists and belongs to user
    const checkResult = await query(
      'SELECT id FROM waitlist WHERE id = $1 AND user_id = $2',
      [waitlistId, user.id]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Waitlist entry not found');
    }

    // Soft delete - mark as cancelled
    await query(
      'UPDATE waitlist SET status = $1 WHERE id = $2',
      ['cancelled', waitlistId]
    );

    logger.info('Waitlist entry cancelled', { waitlistId, userId: user.id });

    const response = NextResponse.json({
      success: true,
      message: 'Waitlist entry removed successfully',
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    logger.error('Delete waitlist error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove waitlist entry' },
      { status: 500 }
    );
  }
}

