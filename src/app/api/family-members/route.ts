import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const familyMemberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  relationship: z.string().optional(),
  medicalHistory: z.record(z.any()).optional(),
  allergies: z.array(z.string()).optional(),
});

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const data = familyMemberSchema.parse(body);

    const result = await query(
      `INSERT INTO family_members 
       (account_owner_id, first_name, last_name, date_of_birth, relationship, medical_history, allergies)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        user.id,
        data.firstName,
        data.lastName,
        data.dateOfBirth || null,
        data.relationship || null,
        data.medicalHistory ? JSON.stringify(data.medicalHistory) : null,
        data.allergies || null,
      ]
    );

    logger.info('Family member added', { id: result.rows[0].id, userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: { familyMember: result.rows[0] },
    }, { status: 201 });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    logger.error('Add family member error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to add family member' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);

    const result = await query(
      'SELECT * FROM family_members WHERE account_owner_id = $1 ORDER BY created_at DESC',
      [user.id]
    );

    const response = NextResponse.json({
      success: true,
      data: { familyMembers: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch family members' },
      { status: 500 }
    );
  }
}

