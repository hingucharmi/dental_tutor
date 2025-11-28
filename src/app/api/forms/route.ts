import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const formSchema = z.object({
  appointmentId: z.number().optional(),
  formType: z.string().min(1, 'Form type is required'),
  formData: z.record(z.any()),
});

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    
    logger.info('Form submission attempt', { 
      userId: user.id, 
      body: JSON.stringify(body) 
    });
    
    const data = formSchema.parse(body);

    // If appointmentId provided, verify it belongs to user
    if (data.appointmentId) {
      const appointmentCheck = await query(
        'SELECT id FROM appointments WHERE id = $1 AND user_id = $2',
        [data.appointmentId, user.id]
      );

      if (appointmentCheck.rows.length === 0) {
        logger.warn('Appointment not found or access denied', { 
          appointmentId: data.appointmentId, 
          userId: user.id 
        });
        return NextResponse.json(
          { success: false, error: 'Appointment not found or you do not have access to it' },
          { status: 404 }
        );
      }
    }

    // Create form submission
    const result = await query(
      `INSERT INTO forms 
       (user_id, appointment_id, form_type, form_data, status)
       VALUES ($1, $2, $3, $4, 'submitted')
       RETURNING id, user_id, appointment_id, form_type, form_data, submitted_at, status, created_at`,
      [
        user.id,
        data.appointmentId || null,
        data.formType,
        JSON.stringify(data.formData),
      ]
    );

    logger.info('Form submitted successfully', { 
      formId: result.rows[0].id, 
      userId: user.id,
      formType: data.formType 
    });

    const response = NextResponse.json({
      success: true,
      data: {
        form: {
          id: result.rows[0].id,
          userId: result.rows[0].user_id,
          appointmentId: result.rows[0].appointment_id,
          formType: result.rows[0].form_type,
          formData: result.rows[0].form_data,
          submittedAt: result.rows[0].submitted_at,
          status: result.rows[0].status,
          createdAt: result.rows[0].created_at,
        },
      },
    }, { status: 201 });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    // Check for database table errors
    if (error?.code === '42P01') {
      logger.error('Forms table does not exist', error as Error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Forms table does not exist. Please run migrations: npm run db:migrate' 
        },
        { status: 500 }
      );
    }

    // Check for authentication errors
    if (error?.message?.includes('Authentication')) {
      logger.error('Authentication error', error as Error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    // Check for appointment not found
    if (error?.message?.includes('Appointment not found')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    logger.error('Submit form error', error as Error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to submit form',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get('appointmentId');
    const formType = searchParams.get('formType');

    let queryStr = `
      SELECT f.*, a.appointment_date, a.appointment_time
      FROM forms f
      LEFT JOIN appointments a ON f.appointment_id = a.id
      WHERE f.user_id = $1
    `;
    const params: any[] = [user.id];

    if (appointmentId) {
      queryStr += ' AND f.appointment_id = $2';
      params.push(parseInt(appointmentId));
    }

    if (formType) {
      queryStr += ` AND f.form_type = $${params.length + 1}`;
      params.push(formType);
    }

    queryStr += ' ORDER BY f.submitted_at DESC';

    const result = await query(queryStr, params);

    const forms = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      appointmentId: row.appointment_id,
      appointmentDate: row.appointment_date,
      appointmentTime: row.appointment_time,
      formType: row.form_type,
      formData: row.form_data,
      submittedAt: row.submitted_at,
      status: row.status,
      createdAt: row.created_at,
    }));

    const response = NextResponse.json({
      success: true,
      data: { forms },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    logger.error('Get forms error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch forms' },
      { status: 500 }
    );
  }
}

