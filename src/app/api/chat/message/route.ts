import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/middleware/auth';
import { getRAGChatResponse } from '@/lib/services/rag-chatbot';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const messageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  conversationId: z.number().nullable().optional(),
  language: z.string().optional().default('en'),
});

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const { message, conversationId, language } = messageSchema.parse(body);

    const chatResponse = await getRAGChatResponse(
      message,
      conversationId || null,
      user.id,
      language || 'en'
    );

    const result = NextResponse.json({
      success: true,
      data: {
        response: chatResponse.response,
        conversationId: chatResponse.conversationId,
        appointmentAction: chatResponse.appointmentAction || null,
        appointmentId: chatResponse.appointmentId || null,
      },
    });

    return addCorsHeaders(result, req);
  } catch (error) {
    logger.error('Chat message error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

