import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { addCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Get today's date in YYYY-MM-DD format (local timezone)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Get current time in HH:MM format (local timezone)
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    let queryStr = `
      SELECT a.*, s.name as service_name, s.description as service_description
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.user_id = $1 
      AND (
        a.appointment_date < $2::date
        OR (a.appointment_date = $2::date AND a.appointment_time::time < $3::time)
      )
    `;
    const params: any[] = [user.id, startDate || todayStr, currentTime];

    if (endDate) {
      queryStr += ' AND a.appointment_date >= $3';
      params.push(endDate);
    }

    if (status) {
      queryStr += ` AND a.status = $${params.length + 1}`;
      params.push(status);
    }

    queryStr += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT 50';

    const result = await query(queryStr, params);

    // Check form completion and other metadata for each appointment
    const appointmentsWithMetadata = await Promise.all(
      result.rows.map(async (row) => {
        // Check if forms exist for this appointment
        const formCheck = await query(
          `SELECT COUNT(*) as count FROM forms 
           WHERE appointment_id = $1 AND status = 'submitted'`,
          [row.id]
        );
        const formCompleted = parseInt(formCheck.rows[0]?.count || '0') > 0;

        // Check if prescription exists
        const prescriptionCheck = await query(
          `SELECT COUNT(*) as count FROM prescriptions 
           WHERE appointment_id = $1 AND status = 'active'`,
          [row.id]
        );
        const hasPrescription = parseInt(prescriptionCheck.rows[0]?.count || '0') > 0;

        // Check if care instructions exist (care_instructions table doesn't have appointment_id,
        // but we can check if there are any general care instructions available)
        // For now, we'll set this based on whether the appointment is completed
        const hasCareInstructions = row.status === 'completed';

        return {
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
          formCompleted,
          preCheckCompleted: formCompleted,
          hasPrescription,
          hasCareInstructions,
        };
      })
    );

    const appointments = appointmentsWithMetadata;

    const response = NextResponse.json({
      success: true,
      data: { appointments },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointment history' },
      { status: 500 }
    );
  }
}

