import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { NotFoundError } from '@/lib/utils/errors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = parseInt(params.id);

    const result = await query(
      'SELECT * FROM services WHERE id = $1',
      [serviceId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Service not found');
    }

    const row = result.rows[0];
    const service = {
      id: row.id,
      name: row.name,
      description: row.description,
      duration: row.duration,
      basePrice: parseFloat(row.base_price) || null,
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    const response = NextResponse.json({
      success: true,
      data: { service },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

