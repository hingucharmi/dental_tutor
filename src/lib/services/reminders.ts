import { query } from '@/lib/db';
import { logger } from '@/lib/utils/logger';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

export interface ReminderConfig {
  hoursBefore: number;
  emailEnabled: boolean;
  smsEnabled: boolean;
}

// Get user's timezone or default to UTC
async function getUserTimezone(userId: number): Promise<string> {
  try {
    const result = await query(
      'SELECT timezone FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length > 0 && result.rows[0].timezone) {
      return result.rows[0].timezone;
    }
    
    // Default to clinic timezone or UTC
    return process.env.CLINIC_TIMEZONE || 'UTC';
  } catch (error) {
    logger.error('Error fetching user timezone', error as Error);
    return process.env.CLINIC_TIMEZONE || 'UTC';
  }
}

export async function getAppointmentsNeedingReminders(hoursBefore: number = 24) {
  const clinicTimezone = process.env.CLINIC_TIMEZONE || 'UTC';
  const now = new Date();
  
  // Get current time in clinic timezone
  const nowInClinicTz = toZonedTime(now, clinicTimezone);
  
  // Calculate reminder time window
  const reminderTimeStart = new Date(nowInClinicTz);
  reminderTimeStart.setHours(reminderTimeStart.getHours() + hoursBefore);
  
  const reminderTimeEnd = new Date(reminderTimeStart);
  reminderTimeEnd.setHours(reminderTimeEnd.getHours() + 1); // 1 hour window
  
  // Format dates for SQL query
  const reminderDate = formatInTimeZone(reminderTimeStart, clinicTimezone, 'yyyy-MM-dd');
  const reminderTimeStartStr = formatInTimeZone(reminderTimeStart, clinicTimezone, 'HH:mm:ss');
  const reminderTimeEndStr = formatInTimeZone(reminderTimeEnd, clinicTimezone, 'HH:mm:ss');

  const result = await query(
    `SELECT a.*, u.email, u.first_name, u.last_name, u.phone, u.timezone as user_timezone,
            s.name as service_name
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
       AND n.metadata->>'reminderHours' = $4::text
       AND DATE(n.sent_at AT TIME ZONE 'UTC') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
     )`,
    [
      reminderDate,
      reminderTimeStartStr.substring(0, 5), // HH:mm format
      reminderTimeEndStr.substring(0, 5),
      hoursBefore.toString(),
    ]
  );

  return result.rows;
}

export async function createReminderNotification(
  userId: number,
  appointmentId: number,
  channel: 'email' | 'sms' | 'push',
  content: string,
  reminderHours: number
) {
  try {
    // Insert notification - unique constraint will prevent duplicates
    await query(
      `INSERT INTO notifications 
       (user_id, type, channel, title, content, status, metadata)
       VALUES ($1, 'appointment_reminder', $2, 'Appointment Reminder', $3, 'sent', $4)`,
      [
        userId,
        channel,
        content,
        JSON.stringify({ 
          appointmentId, 
          reminderHours,
          sentAt: new Date().toISOString()
        }),
      ]
    );

    logger.info('Reminder notification created', { userId, appointmentId, channel, reminderHours });
  } catch (error: any) {
    // Check if it's a unique constraint violation (idempotency)
    if (error.code === '23505') {
      logger.info('Reminder notification already exists (idempotent)', { userId, appointmentId, channel, reminderHours });
      return; // Already sent, skip
    }
    throw error;
  }
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

// Check if reminder was already sent (improved idempotency)
export async function hasReminderBeenSent(
  userId: number,
  appointmentId: number,
  channel: 'email' | 'sms' | 'push',
  reminderHours: number
): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  const result = await query(
    `SELECT COUNT(*) as count
     FROM notifications
     WHERE user_id = $1
     AND type = 'appointment_reminder'
     AND channel = $2
     AND metadata->>'appointmentId' = $3::text
     AND metadata->>'reminderHours' = $4::text
     AND DATE(sent_at AT TIME ZONE 'UTC') = $5`,
    [userId, channel, appointmentId.toString(), reminderHours.toString(), today]
  );

  return parseInt(result.rows[0].count) > 0;
}
