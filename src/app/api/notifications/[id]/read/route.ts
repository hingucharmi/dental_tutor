import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { NotFoundError } from '@/lib/utils/errors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(req);
    const notificationId = parseInt(params.id);

    // Check if notification exists and belongs to user
    const checkResult = await query(
      'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, user.id]
    );

    if (checkResult.rows.length === 0) {
      throw new NotFoundError('Notification not found');
    }

    // Mark as read
    await query(
      'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = $1',
      [notificationId]
    );

    const response = NextResponse.json({
      success: true,
      message: 'Notification marked as read',
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
      { success: false, error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

