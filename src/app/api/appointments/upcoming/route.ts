import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { logger } from '@/lib/utils/logger';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    // Get today's date in YYYY-MM-DD format (local timezone)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get current time in HH:MM format (local timezone)
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Query: Show appointments where date >= today (simplified for reliability)
    // For today's appointments, we'll show all of them and filter by time on the client if needed
    const result = await query(
      `SELECT a.*, s.name as service_name, s.description as service_description
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       WHERE a.user_id = $1 
       AND a.status != 'cancelled'
       AND a.appointment_date >= $2::date
       ORDER BY a.appointment_date ASC, a.appointment_time ASC
       LIMIT 50`,
      [user.id, todayStr]
    );

    logger.info('Upcoming appointments query', { 
      userId: user.id, 
      todayStr, 
      currentTime,
      count: result.rows.length 
    });

    const appointments = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      dentistId: row.dentist_id,
      serviceId: row.service_id,
      serviceName: row.service_name,
      serviceDescription: row.service_description,
      appointmentDate: row.appointment_date,
      appointmentTime: row.appointment_time,
      duration: row.duration,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const response = NextResponse.json({
      success: true,
      data: { appointments },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch upcoming appointments' },
      { status: 500 }
    );
  }
}

