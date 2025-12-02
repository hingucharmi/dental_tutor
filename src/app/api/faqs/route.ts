import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { addCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let queryStr = 'SELECT * FROM faqs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      queryStr += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    if (search) {
      queryStr += ` AND (question ILIKE $${paramIndex} OR answer ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Order by display_order and helpful_count (columns added in Phase 4 migration)
    queryStr += ` ORDER BY display_order ASC, helpful_count DESC`;

    const result = await query(queryStr, params);

    const response = NextResponse.json({
      success: true,
      data: { faqs: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    console.error('Error fetching FAQs:', error);
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to fetch FAQs' 
      },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

