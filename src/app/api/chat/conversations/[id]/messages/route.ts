import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { getConversationHistory } from '@/lib/services/rag-chatbot';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { logger } from '@/lib/utils/logger';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    const conversationId = parseInt(id);

    if (isNaN(conversationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid conversation ID' },
        { status: 400 }
      );
    }

    const messages = await getConversationHistory(conversationId, user.id);

    // Verify the conversation belongs to the user
    // This is handled by getConversationHistory internally, but we can add an extra check
    const result = NextResponse.json({
      success: true,
      data: { messages },
    });

    return addCorsHeaders(result, req);
  } catch (error) {
    logger.error('Get conversation messages error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

