import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { addCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const specialization = searchParams.get('specialization');

    // Optimized query using subquery for reviews aggregation
    let queryStr = `
      SELECT d.*, 
       u.first_name,
       u.last_name,
       CONCAT(u.first_name, ' ', u.last_name) as name,
       COALESCE(review_stats.average_rating, 0) as average_rating,
       COALESCE(review_stats.review_count, 0) as review_count
       FROM dentists d
       LEFT JOIN users u ON d.user_id = u.id
       LEFT JOIN (
         SELECT dentist_id,
                AVG(rating) as average_rating,
                COUNT(id) as review_count
         FROM reviews
         WHERE status = 'approved'
         GROUP BY dentist_id
       ) review_stats ON d.id = review_stats.dentist_id
    `;
    const params: any[] = [];

    if (specialization) {
      queryStr += ' WHERE d.specialization = $1';
      params.push(specialization);
    }

    queryStr += ' ORDER BY u.first_name ASC, u.last_name ASC';

    const result = await query(queryStr, params);

    const dentists = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      specialization: row.specialization,
      bio: row.bio,
      specialties: row.specialties,
      education: row.education,
      yearsExperience: row.years_experience,
      languages: row.languages,
      averageRating: parseFloat(row.average_rating) || 0,
      reviewCount: parseInt(row.review_count) || 0,
    }));

    const response = NextResponse.json({
      success: true,
      data: { dentists },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch dentists' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

