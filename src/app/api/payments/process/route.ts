import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const paymentSchema = z.object({
  appointmentId: z.number().optional(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  paymentMethod: z.enum(['stripe', 'paypal', 'cash', 'check', 'insurance']),
  metadata: z.record(z.any()).optional(),
});

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const data = paymentSchema.parse(body);

    // Verify appointment belongs to user if provided
    if (data.appointmentId) {
      const appointmentCheck = await query(
        'SELECT id FROM appointments WHERE id = $1 AND user_id = $2',
        [data.appointmentId, user.id]
      );

      if (appointmentCheck.rows.length === 0) {
        const errorResponse = NextResponse.json(
          { success: false, error: 'Appointment not found' },
          { status: 404 }
        );
        return addCorsHeaders(errorResponse, req);
      }

      // Check if payment already exists for this appointment
      const existingPayment = await query(
        `SELECT id, status, amount FROM payment_transactions 
         WHERE appointment_id = $1 
         AND status IN ('completed', 'pending', 'processing')
         ORDER BY created_at DESC LIMIT 1`,
        [data.appointmentId]
      );

      if (existingPayment.rows.length > 0) {
        const existing = existingPayment.rows[0];
        const errorResponse = NextResponse.json(
          { 
            success: false, 
            error: `Payment already exists for this appointment. Payment status: ${existing.status}`,
            existingPayment: {
              id: existing.id,
              status: existing.status,
              amount: parseFloat(existing.amount),
            }
          },
          { status: 400 }
        );
        return addCorsHeaders(errorResponse, req);
      }
    }

    // TODO: Integrate with payment gateway (Stripe/PayPal)
    // For now, create a pending transaction
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate invoice number: INV-YYYY-NNNNNN format
    const year = new Date().getFullYear();
    const invoiceCountResult = await query(
      `SELECT COUNT(*) as count FROM payment_transactions 
       WHERE EXTRACT(YEAR FROM created_at) = $1`,
      [year]
    );
    const invoiceNumber = `INV-${year}-${String(parseInt(invoiceCountResult.rows[0].count) + 1).padStart(6, '0')}`;
    
    // Add invoice number to metadata
    const metadataWithInvoice = {
      ...(data.metadata || {}),
      invoiceNumber: invoiceNumber,
    };
    
    const result = await query(
      `INSERT INTO payment_transactions 
       (user_id, appointment_id, amount, currency, payment_method, 
        payment_gateway, transaction_id, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
       RETURNING *`,
      [
        user.id,
        data.appointmentId || null,
        data.amount,
        data.currency,
        data.paymentMethod,
        ['stripe', 'paypal'].includes(data.paymentMethod) ? data.paymentMethod : null,
        transactionId,
        JSON.stringify(metadataWithInvoice),
      ]
    );

    logger.info('Payment transaction created', { id: result.rows[0].id, userId: user.id });

    // TODO: Process payment through gateway
    // For now, simulate success
    if (['stripe', 'paypal'].includes(data.paymentMethod)) {
      // In production, call payment gateway API here
      await query(
        `UPDATE payment_transactions 
         SET status = 'completed', gateway_transaction_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [`gateway_${transactionId}`, result.rows[0].id]
      );
    }

    const transaction = result.rows[0];
    const finalStatus = ['stripe', 'paypal'].includes(data.paymentMethod) ? 'completed' : 'pending';
    
    // Update status if needed
    if (finalStatus === 'completed' && transaction.status !== 'completed') {
      await query(
        `UPDATE payment_transactions 
         SET status = 'completed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [transaction.id]
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      data: { 
        transaction: {
          ...transaction,
          status: finalStatus,
          invoiceNumber: invoiceNumber,
          subtotal: data.metadata?.subtotal || data.amount,
          taxAmount: data.metadata?.taxAmount || 0,
          taxRate: data.metadata?.taxRate || 0,
          totalAmount: data.amount,
        }
      },
    }, { status: 201 });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorResponse = NextResponse.json(
        { 
          success: false, 
          error: error.errors[0].message,
          details: error.errors 
        },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    logger.error('Process payment error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to process payment' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

