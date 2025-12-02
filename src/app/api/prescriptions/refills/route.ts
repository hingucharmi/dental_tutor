import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const refillRequestSchema = z.object({
  prescriptionId: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    if (isNaN(num)) throw new Error('prescriptionId must be a valid number');
    return num;
  }),
  notes: z.string().optional(),
  reason: z.string().optional(), // Accept reason as alias for notes
  pharmacyName: z.string().optional(),
  pharmacyPhone: z.string().optional(),
});

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const data = refillRequestSchema.parse(body);

    // Use reason if provided, otherwise use notes
    const notes = data.reason || data.notes || null;
    
    // Build notes with pharmacy info if provided
    let notesText = notes;
    if (data.pharmacyName || data.pharmacyPhone) {
      const pharmacyInfo: string[] = [];
      if (data.pharmacyName) pharmacyInfo.push(`Pharmacy: ${data.pharmacyName}`);
      if (data.pharmacyPhone) pharmacyInfo.push(`Phone: ${data.pharmacyPhone}`);
      if (notes) pharmacyInfo.push(`Reason: ${notes}`);
      notesText = pharmacyInfo.join('\n');
    }

    // First check if prescription exists at all
    const prescriptionExists = await query(
      'SELECT id, user_id, refills_remaining, medication_name FROM prescriptions WHERE id = $1',
      [data.prescriptionId]
    );

    if (prescriptionExists.rows.length === 0) {
      // Check if user has any prescriptions
      const userPrescriptions = await query(
        'SELECT id, medication_name FROM prescriptions WHERE user_id = $1 LIMIT 5',
        [user.id]
      );

      return NextResponse.json(
        { 
          success: false, 
          error: 'Prescription not found',
          details: `No prescription found with ID ${data.prescriptionId}`,
          suggestion: userPrescriptions.rows.length > 0 
            ? `You have ${userPrescriptions.rows.length} prescription(s). Available IDs: ${userPrescriptions.rows.map((p: any) => p.id).join(', ')}`
            : 'You have no prescriptions. Create one first using POST /api/prescriptions'
        },
        { status: 404 }
      );
    }

    const prescription = prescriptionExists.rows[0];

    // Check if prescription belongs to user
    if (prescription.user_id !== user.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Prescription not found',
          details: 'This prescription does not belong to your account'
        },
        { status: 404 }
      );
    }

    // Check refills remaining (allow refill even if 0, but warn)
    if (prescription.refills_remaining <= 0) {
      // Still allow the request but note it in the response
      logger.warn('Refill requested for prescription with no refills remaining', {
        prescriptionId: data.prescriptionId,
        userId: user.id
      });
    }

    const result = await query(
      `INSERT INTO prescription_refills 
       (prescription_id, user_id, status, notes)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`,
      [data.prescriptionId, user.id, notesText]
    );

    logger.info('Refill request created', { id: result.rows[0].id, userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: { refillRequest: result.rows[0] },
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

    logger.error('Create refill request error', error as Error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create refill request';
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

    let queryStr = `
      SELECT pr.*, p.medication_name, p.dosage
      FROM prescription_refills pr
      JOIN prescriptions p ON pr.prescription_id = p.id
      WHERE pr.user_id = $1
    `;
    const params: any[] = [user.id];

    if (status) {
      queryStr += ' AND pr.status = $2';
      params.push(status);
    }

    queryStr += ' ORDER BY pr.request_date DESC';

    const result = await query(queryStr, params);

    const response = NextResponse.json({
      success: true,
      data: { refillRequests: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch refill requests' },
      { status: 500 }
    );
  }
}

