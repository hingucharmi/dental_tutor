import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    const documentId = parseInt(id);
    const { searchParams } = new URL(req.url);
    const download = searchParams.get('download') === 'true';

    if (isNaN(documentId)) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Invalid document ID' },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    const result = await query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [documentId, user.id]
    );

    if (result.rows.length === 0) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    const document = result.rows[0];

    if (download) {
      // In production, serve file from cloud storage (S3, Cloudinary, etc.)
      // For now, return file path info
      const response = NextResponse.json({
        success: true,
        data: {
          document: {
            ...document,
            downloadUrl: `/api/documents/${documentId}/download`,
          },
        },
      });
      return addCorsHeaders(response, req);
    }

    const response = NextResponse.json({
      success: true,
      data: { document },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Get document error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch document' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(req);
    const { id } = await params;
    const documentId = parseInt(id);

    if (isNaN(documentId)) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Invalid document ID' },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    // Verify ownership
    const checkResult = await query(
      'SELECT id, file_path FROM documents WHERE id = $1 AND user_id = $2',
      [documentId, user.id]
    );

    if (checkResult.rows.length === 0) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    // TODO: Delete file from storage (S3, Cloudinary, etc.)
    // For now, just delete database record

    const result = await query(
      'DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING *',
      [documentId, user.id]
    );

    logger.info('Document deleted', { id: documentId, userId: user.id });

    const response = NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      data: { document: result.rows[0] },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    logger.error('Delete document error', error);
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to delete document' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

