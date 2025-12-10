import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { query } from '@/lib/db';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { logger } from '@/lib/utils/logger';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  try {
    const user = requireAuth(req);

    // Delete all messages for user's conversations
    await query(
      `DELETE FROM messages 
       WHERE conversation_id IN (
         SELECT id FROM conversations WHERE user_id = $1
       )`,
      [user.id]
    );

    // Delete all conversations for the user
    await query(
      `DELETE FROM conversations WHERE user_id = $1`,
      [user.id]
    );

    logger.info('Conversation history cleared', { userId: user.id });

    const result = NextResponse.json({
      success: true,
      message: 'Conversation history cleared successfully',
    });

    return addCorsHeaders(result, req);
  } catch (error) {
    logger.error('Clear conversation history error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear conversation history' },
      { status: 500 }
    );
  }
}

