import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { addCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    let queryStr = 'SELECT * FROM alerts';
    const params: any[] = [];

    if (activeOnly) {
      queryStr += ' WHERE is_active = $1';
      params.push(true);
    }

    queryStr += ' ORDER BY priority DESC, created_at DESC';

    const result = await query(queryStr, params);

    const response = NextResponse.json({
      success: true,
      data: { alerts: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

