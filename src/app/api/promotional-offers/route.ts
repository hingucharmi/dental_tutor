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
    const serviceId = searchParams.get('serviceId');

    let queryStr = 'SELECT * FROM promotional_offers';
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (activeOnly) {
      conditions.push(`is_active = $${paramIndex++}`);
      params.push(true);
      conditions.push(`start_date <= CURRENT_DATE`);
      conditions.push(`(end_date IS NULL OR end_date >= CURRENT_DATE)`);
    }

    if (serviceId) {
      conditions.push(`(service_id IS NULL OR service_id = $${paramIndex++})`);
      params.push(parseInt(serviceId));
    }

    if (conditions.length > 0) {
      queryStr += ' WHERE ' + conditions.join(' AND ');
    }

    queryStr += ' ORDER BY start_date DESC, created_at DESC';

    const result = await query(queryStr, params);

    const response = NextResponse.json({
      success: true,
      data: { offers: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch promotional offers' },
      { status: 500 }
    );
  }
}

