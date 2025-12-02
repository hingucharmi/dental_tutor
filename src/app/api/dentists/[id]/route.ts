import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { NotFoundError } from '@/lib/utils/errors';

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dentistId = parseInt(id);

    const result = await query(
      `SELECT d.*, 
       u.first_name,
       u.last_name,
       CONCAT(u.first_name, ' ', u.last_name) as name,
       AVG(r.rating) as average_rating,
       COUNT(r.id) as review_count
       FROM dentists d
       LEFT JOIN users u ON d.user_id = u.id
       LEFT JOIN reviews r ON d.id = r.dentist_id AND r.status = 'approved'
       WHERE d.id = $1
       GROUP BY d.id, u.first_name, u.last_name`,
      [dentistId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Dentist not found');
    }

    const dentist = result.rows[0];

    const response = NextResponse.json({
      success: true,
      data: {
        dentist: {
          id: dentist.id,
          name: dentist.name,
          specialization: dentist.specialization,
          bio: dentist.bio,
          specialties: dentist.specialties,
          education: dentist.education,
          yearsExperience: dentist.years_experience,
          languages: dentist.languages,
          averageRating: parseFloat(dentist.average_rating) || 0,
          reviewCount: parseInt(dentist.review_count) || 0,
        },
      },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      const errorResponse = NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch dentist' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

