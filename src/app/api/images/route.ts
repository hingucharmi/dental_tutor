import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const imageSchema = z.object({
  appointmentId: z.number().optional(),
  imageType: z.enum(['symptom', 'xray', 'before_after', 'other']),
  fileName: z.string().min(1),
  filePath: z.string().min(1),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  thumbnailPath: z.string().optional(),
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
    const data = imageSchema.parse(body);

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
      `INSERT INTO patient_images 
       (user_id, appointment_id, image_type, file_name, file_path, 
        file_size, mime_type, thumbnail_path, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        user.id,
        data.appointmentId || null,
        data.imageType,
        data.fileName,
        data.filePath,
        data.fileSize || null,
        data.mimeType || null,
        data.thumbnailPath || null,
        data.description || null,
      ]
    );

    logger.info('Image uploaded', { id: result.rows[0].id, userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: { image: result.rows[0] },
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

    logger.error('Upload image error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to upload image' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const imageType = searchParams.get('type');
    const appointmentId = searchParams.get('appointmentId');

    let queryStr = `
      SELECT * FROM patient_images 
      WHERE user_id = $1
    `;
    const params: any[] = [user.id];
    let paramIndex = 2;

    if (imageType) {
      queryStr += ` AND image_type = $${paramIndex++}`;
      params.push(imageType);
    }

    if (appointmentId) {
      queryStr += ` AND appointment_id = $${paramIndex++}`;
      params.push(parseInt(appointmentId));
    }

    queryStr += ' ORDER BY created_at DESC';

    const result = await query(queryStr, params);

    const response = NextResponse.json({
      success: true,
      data: { images: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Get images error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch images' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

