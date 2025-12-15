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
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const isAdmin = user.role === 'admin' || user.role === 'staff';
    const isDentist = user.role === 'dentist';

    const params: (string | number)[] = [];
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
      WHERE a.status != 'cancelled'
        AND a.appointment_date >= $1::date
    `;

    // Adjust filters based on role
    if (isAdmin) {
      params.push(todayStr);
    } else if (isDentist) {
      queryStr += ' AND (a.dentist_id = $2 OR a.dentist_id IS NULL)';
      params.push(todayStr, user.id);
    } else {
      queryStr += ' AND a.user_id = $2';
      params.push(todayStr, user.id);
    }

    queryStr += ' ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT 50';

    const result = await query(queryStr, params);

    logger.info('Upcoming appointments query', { 
      userId: user.id, 
      role: user.role,
      todayStr, 
      currentTime,
      count: result.rows.length 
    });

    // Check form completion for each appointment
    const appointmentsWithForms = await Promise.all(
      result.rows.map(async (row) => {
        const requiredForms = ['medical_history', 'patient_registration', 'consent_treatment', 'consent_hipaa', 'consent_financial'];
        const formCheck = await query(
          `SELECT form_type FROM forms 
           WHERE appointment_id = $1 AND status = 'submitted'`,
          [row.id]
        );
        const completedFormTypes = formCheck.rows.map(r => r.form_type);
        const completedCount = completedFormTypes.filter(type => requiredForms.includes(type)).length;
        const formCompleted = completedCount === requiredForms.length;
        const formPartiallyCompleted = completedCount > 0 && completedCount < requiredForms.length;

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
          hasBeenRescheduled: row.has_been_rescheduled || false,
          hasBeenCancelled: row.has_been_cancelled || false,
          rescheduleCount: row.reschedule_count || 0,
          cancelCount: row.cancel_count || 0,
          formCompleted,
          formPartiallyCompleted,
          formCompletedCount: completedCount,
          formTotalCount: requiredForms.length,
          preCheckCompleted: formCompleted,
          hasPrescription,
          hasCareInstructions,
          patientFirstName: row.first_name,
          patientLastName: row.last_name,
          patientEmail: row.email,
        };
      })
    );

    const appointments = appointmentsWithForms;

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

