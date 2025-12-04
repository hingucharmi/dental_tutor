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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Try payment_transactions first (Phase 5), fallback to payments (Phase 3)
    let queryStr = `
      SELECT pt.*, a.appointment_date, a.appointment_time, s.name as service_name
      FROM payment_transactions pt
      LEFT JOIN appointments a ON pt.appointment_id = a.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE pt.user_id = $1
    `;
    const params: any[] = [user.id];

    if (status) {
      queryStr += ' AND pt.status = $2';
      params.push(status);
    }

    queryStr += ` ORDER BY pt.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    let result;
    try {
      result = await query(queryStr, params);
    } catch (error: any) {
      // Fallback to payments table if payment_transactions doesn't exist
      if (error?.code === '42P01' && error?.message?.includes('payment_transactions')) {
        queryStr = `
          SELECT p.*, a.appointment_date, a.appointment_time, s.name as service_name
          FROM payments p
          LEFT JOIN appointments a ON p.appointment_id = a.id
          LEFT JOIN services s ON a.service_id = s.id
          WHERE p.user_id = $1
        `;
        const fallbackParams: any[] = [user.id];
        
        if (status) {
          queryStr += ' AND p.status = $2';
          fallbackParams.push(status);
        }
        
        queryStr += ` ORDER BY p.created_at DESC LIMIT $${fallbackParams.length + 1} OFFSET $${fallbackParams.length + 2}`;
        fallbackParams.push(limit, offset);
        
        result = await query(queryStr, fallbackParams);
      } else {
        throw error;
      }
    }

    const payments = result.rows.map((row) => {
      const metadata = row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : {};
      // Extract invoice number from metadata if it exists, otherwise use invoice_number column
      const invoiceNumber = metadata.invoiceNumber || row.invoice_number || null;
      
      return {
        id: row.id,
        userId: row.user_id,
        appointmentId: row.appointment_id,
        appointmentDate: row.appointment_date,
        appointmentTime: row.appointment_time,
        serviceName: row.service_name || metadata.serviceName,
        amount: parseFloat(row.amount),
        subtotal: metadata.subtotal || parseFloat(row.amount),
        taxAmount: metadata.taxAmount || 0,
        taxRate: metadata.taxRate || 0,
        paymentMethod: row.payment_method,
        status: row.status,
        transactionId: row.transaction_id || row.gateway_transaction_id,
        invoiceNumber: invoiceNumber,
        paidAt: row.paid_at || (row.status === 'completed' ? row.updated_at : null),
        createdAt: row.created_at,
      };
    });

    const response = NextResponse.json({
      success: true,
      data: { payments },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}

