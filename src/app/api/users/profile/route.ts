import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const profileUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  medicalHistory: z.record(z.any()).optional(),
  allergies: z.array(z.string()).optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);

    const result = await query(
      'SELECT id, email, first_name, last_name, phone, date_of_birth, medical_history, allergies, emergency_contact_name, emergency_contact_phone, role FROM users WHERE id = $1',
      [user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = result.rows[0];

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          phone: userData.phone,
          dateOfBirth: userData.date_of_birth,
          medicalHistory: userData.medical_history,
          allergies: userData.allergies,
          emergencyContactName: userData.emergency_contact_name,
          emergencyContactPhone: userData.emergency_contact_phone,
          role: userData.role,
        },
      },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const data = profileUpdateSchema.parse(body);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.firstName) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(data.firstName);
    }
    if (data.lastName) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(data.lastName);
    }
    if (data.phone) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }
    if (data.dateOfBirth) {
      updates.push(`date_of_birth = $${paramIndex++}`);
      values.push(data.dateOfBirth);
    }
    if (data.medicalHistory) {
      updates.push(`medical_history = $${paramIndex++}`);
      values.push(JSON.stringify(data.medicalHistory));
    }
    if (data.allergies) {
      updates.push(`allergies = $${paramIndex++}`);
      values.push(data.allergies);
    }
    if (data.emergencyContactName) {
      updates.push(`emergency_contact_name = $${paramIndex++}`);
      values.push(data.emergencyContactName);
    }
    if (data.emergencyContactPhone) {
      updates.push(`emergency_contact_phone = $${paramIndex++}`);
      values.push(data.emergencyContactPhone);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(user.id);
    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    logger.info('Profile updated', { userId: user.id });

    const response = NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    logger.error('Update profile error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

