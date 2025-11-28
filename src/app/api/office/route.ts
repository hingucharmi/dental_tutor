import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { addCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const result = await query(
      'SELECT * FROM office_info ORDER BY id ASC LIMIT 1'
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
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
    }

    const row = result.rows[0];
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
      latitude: parseFloat(row.latitude) || null,
      longitude: parseFloat(row.longitude) || null,
      parkingInfo: row.parking_info,
      officeHours: row.office_hours,
    };

    const response = NextResponse.json({
      success: true,
      data: { office },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch office information' },
      { status: 500 }
    );
  }
}

