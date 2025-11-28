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

    let queryStr = `
      SELECT p.*, a.appointment_date, a.appointment_time, s.name as service_name
      FROM payments p
      LEFT JOIN appointments a ON p.appointment_id = a.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE p.user_id = $1
    `;
    const params: any[] = [user.id];

    if (status) {
      queryStr += ' AND p.status = $2';
      params.push(status);
    }

    queryStr += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryStr, params);

    const payments = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      appointmentId: row.appointment_id,
      appointmentDate: row.appointment_date,
      appointmentTime: row.appointment_time,
      serviceName: row.service_name,
      amount: parseFloat(row.amount),
      paymentMethod: row.payment_method,
      status: row.status,
      transactionId: row.transaction_id,
      invoiceNumber: row.invoice_number,
      paidAt: row.paid_at,
      createdAt: row.created_at,
    }));

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

