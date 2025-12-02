import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { addCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');

    let queryStr = 'SELECT * FROM dental_tips WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      queryStr += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    if (featured) {
      queryStr += ` AND featured = $${paramIndex++}`;
      params.push(true);
    }

    if (search) {
      queryStr += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    queryStr += ` ORDER BY featured DESC, view_count DESC, created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await query(queryStr, params);

    const response = NextResponse.json({
      success: true,
      data: { tips: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dental tips' },
      { status: 500 }
    );
  }
}

