import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { addCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(req: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, req);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      const errorResponse = NextResponse.json(
        { 
          success: false, 
          error: 'Name, email, and message are required' 
        },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse, req);
    }

    // In a real application, you would save this to a contact_messages table
    // For now, we'll just return success and log it
    console.log('Contact form submission:', { name, email, phone, subject, message });

    // TODO: Save to database when contact_messages table is created
    // await query(
    //   'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES ($1, $2, $3, $4, $5)',
    //   [name, email, phone || null, subject || null, message]
    // );

    const response = NextResponse.json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    console.error('Error processing contact form:', error);
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to submit contact form' 
      },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get office contact information
    const officeResult = await query(
      'SELECT name, address, city, state, zip_code, phone, email FROM office_info ORDER BY id ASC LIMIT 1'
    );

    // Get emergency contacts
    const emergencyResult = await query(
      'SELECT name, phone, email, available_24_7 FROM emergency_contacts ORDER BY priority ASC LIMIT 3'
    );

    const office = officeResult.rows.length > 0 ? {
      name: officeResult.rows[0].name,
      address: officeResult.rows[0].address,
      city: officeResult.rows[0].city,
      state: officeResult.rows[0].state,
      zipCode: officeResult.rows[0].zip_code,
      phone: officeResult.rows[0].phone,
      email: officeResult.rows[0].email,
    } : {
      name: 'Dental Tutor Clinic',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      phone: '555-0100',
      email: 'info@dentaltutor.com',
    };

    // Map emergency contacts to include description based on available_24_7
    const emergencyContacts = emergencyResult.rows.map((row: any) => ({
      name: row.name,
      phone: row.phone,
      email: row.email,
      description: row.available_24_7 
        ? 'Available 24/7' 
        : row.email 
          ? `Email: ${row.email}` 
          : undefined,
    }));

    const response = NextResponse.json({
      success: true,
      data: {
        office,
        emergencyContacts,
      },
    });

    return addCorsHeaders(response, req);
  } catch (error: any) {
    console.error('Error fetching contact information:', error);
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to fetch contact information' 
      },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse, req);
  }
}

