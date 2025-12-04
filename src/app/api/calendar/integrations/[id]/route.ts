import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { logger } from '@/lib/utils/logger';
import { NotFoundError } from '@/lib/utils/errors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    const integrationId = parseInt(id);

    // Check if integration exists and belongs to user
    const checkResult = await query(
      'SELECT id FROM calendar_integrations WHERE id = $1 AND user_id = $2',
      [integrationId, user.id]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Calendar integration not found');
    }

    // Deactivate instead of deleting
    await query(
      'UPDATE calendar_integrations SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [integrationId]
    );

    logger.info('Calendar integration disconnected', { integrationId, userId: user.id });

    const response = NextResponse.json({
      success: true,
      message: 'Calendar integration disconnected successfully',
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    logger.error('Delete calendar integration error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect calendar integration' },
      { status: 500 }
    );
  }
}

