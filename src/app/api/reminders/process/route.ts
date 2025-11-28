import { NextRequest, NextResponse } from 'next/server';
import { getAppointmentsNeedingReminders, getNotificationPreferences, createReminderNotification } from '@/lib/services/reminders';
import { sendEmail, generateAppointmentReminderEmail } from '@/lib/services/email';
import { sendSMS, generateAppointmentReminderSMS } from '@/lib/services/sms';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

// This endpoint should be called by a cron job or scheduled task
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    // Optional: Add API key authentication for cron jobs
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'cron-secret-key'}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const remindersSent = [];
    const errors = [];

    // Get appointments needing reminders (default 24 hours before)
    const appointments = await getAppointmentsNeedingReminders(24);

    for (const appointment of appointments) {
      try {
        // Get user notification preferences
        const preferences = await getNotificationPreferences(appointment.user_id);

        if (!preferences.appointmentReminders) {
          continue;
        }

        const reminderHours = preferences.appointmentReminderHours || 24;
        const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
        const reminderTime = new Date(appointmentDateTime.getTime() - reminderHours * 60 * 60 * 1000);
        const now = new Date();

        // Only send if reminder time is within the next hour
        if (reminderTime > now && reminderTime <= new Date(now.getTime() + 60 * 60 * 1000)) {
          // Send email reminder
          if (preferences.emailEnabled && appointment.email) {
            const emailContent = generateAppointmentReminderEmail(
              appointment.first_name,
              appointment.appointment_date,
              appointment.appointment_time,
              appointment.service_name
            );

            const emailSent = await sendEmail(
              appointment.email,
              emailContent.subject,
              emailContent.html,
              emailContent.text
            );

            if (emailSent) {
              await createReminderNotification(
                appointment.user_id,
                appointment.id,
                'email',
                emailContent.text
              );
              remindersSent.push({ appointmentId: appointment.id, channel: 'email' });
            }
          }

          // Send SMS reminder
          if (preferences.smsEnabled && appointment.phone) {
            const smsContent = generateAppointmentReminderSMS(
              appointment.first_name,
              appointment.appointment_date,
              appointment.appointment_time
            );

            const smsSent = await sendSMS(appointment.phone, smsContent);

            if (smsSent) {
              await createReminderNotification(
                appointment.user_id,
                appointment.id,
                'sms',
                smsContent
              );
              remindersSent.push({ appointmentId: appointment.id, channel: 'sms' });
            }
          }
        }
      } catch (error) {
        logger.error('Error processing reminder', error as Error, { appointmentId: appointment.id });
        errors.push({ appointmentId: appointment.id, error: (error as Error).message });
      }
    }

    const response = NextResponse.json({
      success: true,
      data: {
        processed: appointments.length,
        remindersSent: remindersSent.length,
        errors: errors.length,
        details: { remindersSent, errors },
      },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    logger.error('Process reminders error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}

