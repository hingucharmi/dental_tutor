import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const documentSchema = z.object({
  appointmentId: z.number().optional(),
  documentType: z.enum(['receipt', 'xray', 'treatment_plan', 'prescription', 'form', 'other']),
  fileName: z.string().min(1),
  filePath: z.string().min(1),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  description: z.string().optional(),
});

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const data = documentSchema.parse(body);

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
    }

    const result = await query(
      `INSERT INTO documents 
       (user_id, appointment_id, document_type, file_name, file_path, 
        file_size, mime_type, uploaded_by, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        user.id,
        data.appointmentId || null,
        data.documentType,
        data.fileName,
        data.filePath,
        data.fileSize || null,
        data.mimeType || null,
        user.id,
        data.description || null,
      ]
    );

    logger.info('Document uploaded', { id: result.rows[0].id, userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: { document: result.rows[0] },
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

    logger.error('Upload document error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to upload document' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const documentType = searchParams.get('type');
    const appointmentId = searchParams.get('appointmentId');

    let queryStr = `
      SELECT * FROM documents 
      WHERE user_id = $1
    `;
    const params: any[] = [user.id];
    let paramIndex = 2;

    if (documentType) {
      queryStr += ` AND document_type = $${paramIndex++}`;
      params.push(documentType);
    }

    if (appointmentId) {
      queryStr += ` AND appointment_id = $${paramIndex++}`;
      params.push(parseInt(appointmentId));
    }

    queryStr += ' ORDER BY created_at DESC';

    const result = await query(queryStr, params);

    const response = NextResponse.json({
      success: true,
      data: { documents: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Get documents error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch documents' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

