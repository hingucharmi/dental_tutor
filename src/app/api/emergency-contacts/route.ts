import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { addCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function GET(req: NextRequest) {
  try {
    const result = await query(
      'SELECT * FROM emergency_contacts ORDER BY priority ASC, name ASC'
    );

    const response = NextResponse.json({
      success: true,
      data: { contacts: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    console.error('Error fetching emergency contacts:', error);
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to fetch emergency contacts' 
      },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

