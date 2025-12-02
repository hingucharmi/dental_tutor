import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const insuranceSchema = z.object({
  // Accept both insuranceProvider and providerName for flexibility
  insuranceProvider: z.string().min(1, 'Insurance provider is required').optional(),
  providerName: z.string().min(1, 'Provider name is required').optional(),
  policyNumber: z.string().optional(),
  groupNumber: z.string().optional(),
  subscriberName: z.string().optional(),
  subscriberDob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  relationship: z.string().optional(),
  coverageDetails: z.record(z.any()).optional(),
  // Additional fields that may be sent but not stored in main table
  memberId: z.string().optional(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
}).refine(
  (data) => data.providerName || data.insuranceProvider,
  {
    message: 'Either providerName or insuranceProvider is required',
    path: ['providerName'],
  }
);

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const data = insuranceSchema.parse(body);

    // Use providerName or insuranceProvider (whichever is provided)
    const providerName = data.providerName || data.insuranceProvider;

    // Build coverage details object with additional fields if provided
    const coverageDetails: any = data.coverageDetails || {};
    if (data.memberId) coverageDetails.memberId = data.memberId;
    if (data.effectiveDate) coverageDetails.effectiveDate = data.effectiveDate;
    if (data.expirationDate) coverageDetails.expirationDate = data.expirationDate;

    // Check if coverage_details column exists
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'insurance_info' 
      AND column_name = 'coverage_details'
    `);
    const hasCoverageDetails = columnCheck.rows.length > 0;

    // Build INSERT query based on whether coverage_details column exists
    let insertQuery: string;
    let insertParams: any[];

    if (hasCoverageDetails) {
      insertQuery = `INSERT INTO insurance_info 
       (user_id, provider_name, policy_number, group_number, subscriber_name, 
        subscriber_dob, relationship, coverage_details, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`;
      insertParams = [
        user.id,
        providerName,
        data.policyNumber || null,
        data.groupNumber || null,
        data.subscriberName || null,
        data.subscriberDob || null,
        data.relationship || null,
        Object.keys(coverageDetails).length > 0 ? JSON.stringify(coverageDetails) : null,
      ];
    } else {
      // Fallback: insert without coverage_details column
      insertQuery = `INSERT INTO insurance_info 
       (user_id, provider_name, policy_number, group_number, subscriber_name, 
        subscriber_dob, relationship, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`;
      insertParams = [
        user.id,
        providerName,
        data.policyNumber || null,
        data.groupNumber || null,
        data.subscriberName || null,
        data.subscriberDob || null,
        data.relationship || null,
      ];
    }

    const result = await query(insertQuery, insertParams);

    logger.info('Insurance info created', { id: result.rows[0].id, userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: { insurance: result.rows[0] },
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

    logger.error('Create insurance error', error as Error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create insurance information';
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

    const result = await query(
      'SELECT * FROM insurance_info WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    );

    const response = NextResponse.json({
      success: true,
      data: { insurance: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    logger.error('Get insurance error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insurance information' },
      { status: 500 }
    );
  }
}

