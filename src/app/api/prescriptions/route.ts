import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const prescriptionSchema = z.object({
  appointmentId: z.number().optional(),
  medicationName: z.string().min(1, 'Medication name is required'),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  quantity: z.number().optional(),
  refillsRemaining: z.number().default(3),
  prescribedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  status: z.enum(['active', 'expired', 'completed']).default('active'),
});

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const data = prescriptionSchema.parse(body);

    const prescribedDate = data.prescribedDate || new Date().toISOString().split('T')[0];

    const result = await query(
      `INSERT INTO prescriptions 
       (user_id, appointment_id, medication_name, dosage, frequency, quantity, 
        refills_remaining, prescribed_date, expiry_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        user.id,
        data.appointmentId || null,
        data.medicationName,
        data.dosage || null,
        data.frequency || null,
        data.quantity || null,
        data.refillsRemaining,
        prescribedDate,
        data.expiryDate || null,
        data.status,
      ]
    );

    logger.info('Prescription created', { id: result.rows[0].id, userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: { prescription: result.rows[0] },
    }, { status: 201 });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: errorMessages,
          message: errorMessages[0]?.message || 'Invalid request data'
        },
        { status: 400 }
      );
    }

    logger.error('Create prescription error', error as Error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create prescription';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // Simplified query without JOINs that might fail
    let queryStr = 'SELECT * FROM prescriptions WHERE user_id = $1';
    const params: any[] = [user.id];

    if (status) {
      queryStr += ' AND status = $2';
      params.push(status);
    }

    queryStr += ' ORDER BY prescribed_date DESC';

    const result = await query(queryStr, params);

    const response = NextResponse.json({
      success: true,
      data: { prescriptions: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Get prescriptions error', error as Error);
    const errorMessage = error?.message || 'Failed to fetch prescriptions';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        code: error?.code
      },
      { status: 500 }
    );
  }
}

