import OpenAI from 'openai';
import { query } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Dental knowledge base context
const DENTAL_CONTEXT = `You are a helpful dental assistant chatbot for a dental clinic. Your role is to:
1. Answer questions about dental services, procedures, and oral health
2. Help patients understand appointment booking
3. Provide information about dental care and hygiene
4. Guide patients through common dental concerns

Available Services:
- Routine Checkup: Regular dental examination and cleaning (30 min, $150)
- Teeth Cleaning: Professional teeth cleaning and polishing (45 min, $120)
- Root Canal: Root canal treatment (90 min, $800)
- Tooth Extraction: Simple tooth extraction (30 min, $200)
- Dental Filling: Cavity filling (45 min, $250)
- Teeth Whitening: Professional teeth whitening treatment (60 min, $400)
- Crown: Dental crown placement (60 min, $1200)
- Dental Implant: Dental implant procedure (120 min, $3000)

Office Hours:
- Monday-Thursday: 9:00 AM - 5:00 PM
- Friday: 9:00 AM - 3:00 PM
- Saturday-Sunday: Closed

Always be friendly, professional, and helpful. If you don't know something, suggest contacting the clinic directly.`;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export async function getChatResponse(
  userMessage: string,
  conversationId: number | null,
  userId: number
): Promise<{ response: string; conversationId: number }> {
  try {
    let convId = conversationId;

    // Get or create conversation
    if (!convId) {
      const convResult = await query(
        `INSERT INTO conversations (user_id, started_at, last_message_at)
         VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        [userId]
      );
      convId = convResult.rows[0].id;
    } else {
      // Update last message time
      await query(
        `UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [convId]
      );
    }

    // Get conversation history
    const historyResult = await query(
      `SELECT role, content FROM messages 
       WHERE conversation_id = $1 
       ORDER BY timestamp ASC 
       LIMIT 20`,
      [convId]
    );

    // Build message history for OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: DENTAL_CONTEXT,
      },
      ...historyResult.rows.map((row) => ({
        role: (row.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: row.content,
      })),
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    // Save messages to database
    await query(
      `INSERT INTO messages (conversation_id, role, content, timestamp)
       VALUES ($1, 'user', $2, CURRENT_TIMESTAMP),
              ($1, 'assistant', $3, CURRENT_TIMESTAMP)`,
      [convId, userMessage, aiResponse]
    );

    logger.info('Chat response generated', { conversationId: convId, userId });

    return {
      response: aiResponse,
      conversationId: convId as number,
    };
  } catch (error) {
    logger.error('Chatbot error', error as Error);
    throw new Error('Failed to generate chat response');
  }
}

export async function getConversationHistory(conversationId: number): Promise<ChatMessage[]> {
  const result = await query(
    `SELECT role, content, timestamp FROM messages 
     WHERE conversation_id = $1 
     ORDER BY timestamp ASC`,
    [conversationId]
  );

  return result.rows.map((row) => ({
    role: row.role as 'user' | 'assistant',
    content: row.content,
    timestamp: row.timestamp,
  }));
}

export async function getUserConversations(userId: number) {
  const result = await query(
    `SELECT id, started_at, last_message_at 
     FROM conversations 
     WHERE user_id = $1 
     ORDER BY last_message_at DESC`,
    [userId]
  );

  return result.rows;
}

