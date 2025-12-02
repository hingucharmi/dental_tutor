import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { addCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const treatmentType = searchParams.get('treatmentType');

    let queryStr = 'SELECT * FROM care_instructions';
    const params: any[] = [];

    if (treatmentType) {
      queryStr += ' WHERE treatment_type = $1';
      params.push(treatmentType);
    }

    queryStr += ' ORDER BY id ASC';

    const result = await query(queryStr, params);

    const response = NextResponse.json({
      success: true,
      data: { instructions: result.rows },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch care instructions' },
      { status: 500 }
    );
  }
}

