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

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'serviceId is required' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT * FROM service_pricing 
       WHERE service_id = $1 
       AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
       ORDER BY effective_date DESC
       LIMIT 1`,
      [parseInt(serviceId)]
    );

    if (result.rows.length === 0) {
      // Return default pricing from services table
      const serviceResult = await query(
        'SELECT base_price FROM services WHERE id = $1',
        [parseInt(serviceId)]
      );

      if (serviceResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Service not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          pricing: {
            basePrice: parseFloat(serviceResult.rows[0].base_price) || 0,
            insurancePrice: null,
            cashPrice: null,
          },
        },
      });
    }

    const pricing = result.rows[0];

    const response = NextResponse.json({
      success: true,
      data: {
        pricing: {
          basePrice: parseFloat(pricing.base_price),
          insurancePrice: pricing.insurance_price ? parseFloat(pricing.insurance_price) : null,
          cashPrice: pricing.cash_price ? parseFloat(pricing.cash_price) : null,
        },
      },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}

