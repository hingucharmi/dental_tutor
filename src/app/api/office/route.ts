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
      'SELECT * FROM office_info ORDER BY id ASC LIMIT 1'
    );

    if (result.rows.length === 0) {
      const response = NextResponse.json({
        success: true,
        data: {
          office: {
            name: 'Dental Tutor Clinic',
            address: '123 Main Street',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            phone: '555-0100',
            email: 'info@dentaltutor.com',
            parkingInfo: 'Free parking available',
            officeHours: {
              monday: { start: '09:00', end: '17:00' },
              tuesday: { start: '09:00', end: '17:00' },
              wednesday: { start: '09:00', end: '17:00' },
              thursday: { start: '09:00', end: '17:00' },
              friday: { start: '09:00', end: '15:00' },
              saturday: null,
              sunday: null,
            },
          },
        },
      });
      return addCorsHeaders(response, req);
    }

    const row = result.rows[0];
    
    // Parse office_hours if it's a string (should be JSONB object, but handle both cases)
    let officeHours = row.office_hours;
    if (typeof officeHours === 'string') {
      try {
        officeHours = JSON.parse(officeHours);
      } catch (e) {
        console.warn('Failed to parse office_hours JSON:', e);
        officeHours = null;
      }
    }
    
    const office = {
      id: row.id,
      name: row.name,
      address: row.address,
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      country: row.country,
      phone: row.phone,
      email: row.email,
      latitude: row.latitude ? parseFloat(row.latitude) : null,
      longitude: row.longitude ? parseFloat(row.longitude) : null,
      parkingInfo: row.parking_info,
      officeHours: officeHours,
    };

    const response = NextResponse.json({
      success: true,
      data: { office },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    console.error('Error fetching office information:', error);
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to fetch office information' 
      },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

