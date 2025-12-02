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
    const transactionType = searchParams.get('type');

    let queryStr = `
      SELECT * FROM loyalty_transactions 
      WHERE user_id = $1
    `;
    const params: any[] = [user.id];

    if (transactionType) {
      queryStr += ' AND transaction_type = $2';
      params.push(transactionType);
    }

    queryStr += ' ORDER BY created_at DESC LIMIT 100';

    const result = await query(queryStr, params);

    const response = NextResponse.json({
      success: true,
      data: { transactions: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Get loyalty transactions error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch loyalty transactions' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

