import { query } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

export interface ReminderConfig {
  hoursBefore: number;
  emailEnabled: boolean;
  smsEnabled: boolean;
}

export async function getAppointmentsNeedingReminders(hoursBefore: number = 24) {
  const reminderTime = new Date();
  reminderTime.setHours(reminderTime.getHours() + hoursBefore);

  const result = await query(
    `SELECT a.*, u.email, u.first_name, u.last_name, u.phone, s.name as service_name
     FROM appointments a
     JOIN users u ON a.user_id = u.id
     LEFT JOIN services s ON a.service_id = s.id
     WHERE a.appointment_date = $1
     AND a.status = 'scheduled'
     AND a.appointment_time BETWEEN $2 AND $3
     AND NOT EXISTS (
       SELECT 1 FROM notifications n
       WHERE n.user_id = a.user_id
       AND n.type = 'appointment_reminder'
       AND n.metadata->>'appointmentId' = a.id::text
       AND DATE(n.sent_at) = CURRENT_DATE
     )`,
    [
      reminderTime.toISOString().split('T')[0],
      reminderTime.toTimeString().substring(0, 5),
      reminderTime.toTimeString().substring(0, 5),
    ]
  );

  return result.rows;
}

export async function createReminderNotification(
  userId: number,
  appointmentId: number,
  channel: 'email' | 'sms' | 'push',
  content: string
) {
  await query(
    `INSERT INTO notifications 
     (user_id, type, channel, title, content, status, metadata)
     VALUES ($1, 'appointment_reminder', $2, 'Appointment Reminder', $3, 'sent', $4)`,
    [
      userId,
      channel,
      content,
      JSON.stringify({ appointmentId }),
    ]
  );

  logger.info('Reminder notification created', { userId, appointmentId, channel });
}

export async function getNotificationPreferences(userId: number) {
  const result = await query(
    'SELECT * FROM notification_preferences WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    // Return defaults
    return {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      appointmentReminders: true,
      appointmentReminderHours: 24,
    };
  }

  const row = result.rows[0];
  return {
    emailEnabled: row.email_enabled,
    smsEnabled: row.sms_enabled,
    pushEnabled: row.push_enabled,
    appointmentReminders: row.appointment_reminders,
    appointmentReminderHours: row.appointment_reminder_hours,
  };
}

