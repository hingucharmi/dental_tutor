import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { addCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const painLevel = searchParams.get('painLevel');

    let queryStr = 'SELECT * FROM pain_management_content';
    const params: any[] = [];

    if (painLevel) {
      const level = parseInt(painLevel);
      queryStr += ' WHERE $1 >= pain_level_min AND $1 <= pain_level_max';
      params.push(level);
    }

    queryStr += ' ORDER BY pain_level_min ASC';

    const result = await query(queryStr, params);

    const response = NextResponse.json({
      success: true,
      data: { content: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pain management content' },
      { status: 500 }
    );
  }
}
