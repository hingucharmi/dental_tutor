import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { addCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let queryStr = `
      SELECT * FROM notifications 
      WHERE user_id = $1
    `;
    const params: any[] = [user.id];

    if (unreadOnly) {
      queryStr += ' AND read_at IS NULL';
    }

    queryStr += ` ORDER BY sent_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryStr, params);

    const notifications = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      channel: row.channel,
      title: row.title,
      content: row.content,
      sentAt: row.sent_at,
      readAt: row.read_at,
      status: row.status,
      metadata: row.metadata,
      createdAt: row.created_at,
    }));

    const response = NextResponse.json({
      success: true,
      data: { notifications },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

