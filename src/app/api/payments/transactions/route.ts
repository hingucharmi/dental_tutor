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
    const paymentMethod = searchParams.get('paymentMethod');

    let queryStr = `
      SELECT pt.*, 
       a.appointment_date, a.appointment_time
      FROM payment_transactions pt
      LEFT JOIN appointments a ON pt.appointment_id = a.id
      WHERE pt.user_id = $1
    `;
    const params: any[] = [user.id];
    let paramIndex = 2;

    if (status) {
      queryStr += ` AND pt.status = $${paramIndex++}`;
      params.push(status);
    }

    if (paymentMethod) {
      queryStr += ` AND pt.payment_method = $${paramIndex++}`;
      params.push(paymentMethod);
    }

    queryStr += ' ORDER BY pt.created_at DESC';

    const result = await query(queryStr, params);

    const transactions = result.rows.map((row: any) => {
      const metadata = row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : {};
      return {
        id: row.id,
        appointmentId: row.appointment_id,
        amount: parseFloat(row.amount),
        currency: row.currency || 'USD',
        paymentMethod: row.payment_method,
        paymentGateway: row.payment_gateway,
        transactionId: row.transaction_id || row.gateway_transaction_id,
        gatewayTransactionId: row.gateway_transaction_id,
        status: row.status,
        receiptUrl: row.receipt_url,
        metadata: metadata,
        subtotal: metadata.subtotal || parseFloat(row.amount),
        taxAmount: metadata.taxAmount || 0,
        taxRate: metadata.taxRate || 0,
        invoiceNumber: metadata.invoiceNumber || null,
        appointmentDate: row.appointment_date,
        appointmentTime: row.appointment_time,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    const response = NextResponse.json({
      success: true,
      data: { transactions },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Get transactions error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

