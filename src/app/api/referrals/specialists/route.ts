import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders } from '@/lib/middleware/cors';

// Common dental specialists directory
const SPECIALISTS = [
  { type: 'orthodontist', name: 'Orthodontist', description: 'Teeth alignment and bite correction' },
  { type: 'oral_surgeon', name: 'Oral Surgeon', description: 'Surgical procedures and extractions' },
  { type: 'periodontist', name: 'Periodontist', description: 'Gum disease treatment' },
  { type: 'endodontist', name: 'Endodontist', description: 'Root canal treatment' },
  { type: 'prosthodontist', name: 'Prosthodontist', description: 'Dental prosthetics and implants' },
  { type: 'pediatric_dentist', name: 'Pediatric Dentist', description: 'Children\'s dental care' },
  { type: 'oral_pathologist', name: 'Oral Pathologist', description: 'Oral disease diagnosis' },
  { type: 'oral_radiologist', name: 'Oral Radiologist', description: 'Dental imaging and X-rays' },
];

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    let specialists = SPECIALISTS;

    if (type) {
      specialists = SPECIALISTS.filter(s => s.type === type);
    }

    const response = NextResponse.json({
      success: true,
      data: { specialists },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    const errorResponse = NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch specialists' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

