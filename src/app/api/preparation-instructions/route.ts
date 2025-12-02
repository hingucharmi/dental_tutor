import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { addCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get('serviceId');

    // Check if display_order column exists
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'preparation_instructions' 
      AND column_name = 'display_order'
    `);
    const hasDisplayOrder = columnCheck.rows.length > 0;

    let queryStr = 'SELECT * FROM preparation_instructions';
    const params: any[] = [];

    if (serviceId) {
      const parsedServiceId = parseInt(serviceId, 10);
      if (isNaN(parsedServiceId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid serviceId parameter. Must be a number.' },
          { status: 400 }
        );
      }
      queryStr += ' WHERE service_id = $1';
      params.push(parsedServiceId);
    }

    // Order by display_order if it exists, otherwise by id
    if (hasDisplayOrder) {
      queryStr += ' ORDER BY display_order ASC, id ASC';
    } else {
      queryStr += ' ORDER BY id ASC';
    }

    const result = await query(queryStr, params);

    const response = NextResponse.json({
      success: true,
      data: { instructions: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    console.error('Error fetching preparation instructions:', error);
    const errorMessage = error?.message || 'Failed to fetch preparation instructions';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

