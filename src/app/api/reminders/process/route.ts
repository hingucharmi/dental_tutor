import { NextRequest, NextResponse } from 'next/server';
import { 
  getAppointmentsNeedingReminders, 
  getNotificationPreferences, 
  createReminderNotification,
  hasReminderBeenSent
} from '@/lib/services/reminders';
import { sendEmail, generateAppointmentReminderEmail } from '@/lib/services/email';
import { sendSMS, generateAppointmentReminderSMS } from '@/lib/services/sms';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

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
    const clinicTimezone = process.env.CLINIC_TIMEZONE || 'UTC';

    // Process multiple reminder windows (24h, 2h before)
    const reminderWindows = [24, 2]; // Can be configured

    for (const hoursBefore of reminderWindows) {
      // Get appointments needing reminders for this window
      const appointments = await getAppointmentsNeedingReminders(hoursBefore);

      for (const appointment of appointments) {
        try {
          // Get user notification preferences
          const preferences = await getNotificationPreferences(appointment.user_id);

          if (!preferences.appointmentReminders) {
            continue;
          }

          // Use user's preferred reminder hours or default
          const reminderHours = preferences.appointmentReminderHours || hoursBefore;
          
          // Skip if this specific reminder window doesn't match user preference
          if (reminderHours !== hoursBefore) {
            continue;
          }

          // Get user timezone or use clinic timezone
          const userTimezone = appointment.user_timezone || clinicTimezone;
          
          // Parse appointment date/time in user's timezone
          const appointmentDateTimeStr = `${appointment.appointment_date}T${appointment.appointment_time}`;
          const appointmentDateTime = new Date(appointmentDateTimeStr);
          
          // Calculate reminder time in user's timezone
          const reminderTime = new Date(appointmentDateTime.getTime() - reminderHours * 60 * 60 * 1000);
          const now = new Date();
          
          // Convert to user's timezone for comparison
          const nowInUserTz = toZonedTime(now, userTimezone);
          const reminderTimeInUserTz = toZonedTime(reminderTime, userTimezone);
          
          // Only send if reminder time is within the next hour (in user's timezone)
          const timeDiff = reminderTimeInUserTz.getTime() - nowInUserTz.getTime();
          const oneHour = 60 * 60 * 1000;
          
          if (timeDiff > 0 && timeDiff <= oneHour) {
            // Check idempotency before sending
            const shouldSendEmail = preferences.emailEnabled && appointment.email && 
              !(await hasReminderBeenSent(appointment.user_id, appointment.id, 'email', reminderHours));
            
            const shouldSendSMS = preferences.smsEnabled && appointment.phone && 
              !(await hasReminderBeenSent(appointment.user_id, appointment.id, 'sms', reminderHours));

            // Send email reminder
            if (shouldSendEmail) {
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
                  emailContent.text,
                  reminderHours
                );
                remindersSent.push({ 
                  appointmentId: appointment.id, 
                  channel: 'email',
                  reminderHours 
                });
              }
            }

            // Send SMS reminder
            if (shouldSendSMS) {
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
                  smsContent,
                  reminderHours
                );
                remindersSent.push({ 
                  appointmentId: appointment.id, 
                  channel: 'sms',
                  reminderHours 
                });
              }
            }
          }
        } catch (error) {
          logger.error('Error processing reminder', error as Error, { 
            appointmentId: appointment.id,
            hoursBefore 
          });
          errors.push({ 
            appointmentId: appointment.id, 
            error: (error as Error).message,
            hoursBefore 
          });
        }
      }
    }

    const totalProcessed = remindersSent.length + errors.length;
    
    const response = NextResponse.json({
      success: true,
      data: {
        processed: totalProcessed,
        remindersSent: remindersSent.length,
        errors: errors.length,
        details: { remindersSent, errors },
        timestamp: new Date().toISOString(),
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

