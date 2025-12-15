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

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const isAdmin = user.role === 'admin' || user.role === 'staff';
    const isDentist = user.role === 'dentist';
    const params: (string | number)[] = [];
    const historyCutoff = startDate || todayStr;

    let queryStr = `
      SELECT a.*, 
             s.name as service_name, 
             s.description as service_description,
             u.first_name,
             u.last_name,
             u.email
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE
    `;

    if (isAdmin) {
      queryStr += `
        (a.appointment_date < $1::date
         OR (a.appointment_date = $1::date AND a.appointment_time::time < $2::time))
      `;
      params.push(historyCutoff, currentTime);
    } else {
      const idParam = params.length + 1;
      queryStr += `
        ${isDentist ? `a.dentist_id = $${idParam}` : `a.user_id = $${idParam}`}
        AND (
          a.appointment_date < $${idParam + 1}::date
          OR (a.appointment_date = $${idParam + 1}::date AND a.appointment_time::time < $${idParam + 2}::time)
        )
      `;
      params.push(user.id, historyCutoff, currentTime);
    }

    if (endDate) {
      queryStr += ` AND a.appointment_date >= $${params.length + 1}`;
      params.push(endDate);
    }

    if (status) {
      queryStr += ` AND a.status = $${params.length + 1}`;
      params.push(status);
    }

    queryStr += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT 50';

    const result = await query(queryStr, params);

    const appointmentsWithMetadata = await Promise.all(
      result.rows.map(async (row) => {
        const formCheck = await query(
          `SELECT COUNT(*) as count FROM forms 
           WHERE appointment_id = $1 AND status = 'submitted'`,
          [row.id]
        );
        const formCompleted = parseInt(formCheck.rows[0]?.count || '0') > 0;

        const prescriptionCheck = await query(
          `SELECT COUNT(*) as count FROM prescriptions 
           WHERE appointment_id = $1 AND status = 'active'`,
          [row.id]
        );
        const hasPrescription = parseInt(prescriptionCheck.rows[0]?.count || '0') > 0;

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
          patientFirstName: row.first_name,
          patientLastName: row.last_name,
          patientEmail: row.email,
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

