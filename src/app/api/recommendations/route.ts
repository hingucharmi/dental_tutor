import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let queryStr = `
      SELECT * FROM recommendations 
      WHERE user_id = $1
    `;
    const params: any[] = [user.id];
    let paramIndex = 2;

    if (status) {
      queryStr += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (type) {
      queryStr += ` AND recommendation_type = $${paramIndex++}`;
      params.push(type);
    }

    queryStr += ' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)';
    queryStr += ' ORDER BY priority DESC, created_at DESC';

    const result = await query(queryStr, params);

    const recommendations = result.rows.map((row: any) => ({
      id: row.id,
      recommendationType: row.recommendation_type,
      title: row.title,
      description: row.description,
      priority: row.priority,
      data: row.data,
      status: row.status,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    }));

    const response = NextResponse.json({
      success: true,
      data: { recommendations },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Get recommendations error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch recommendations' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

