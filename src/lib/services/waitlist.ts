import { query } from '@/lib/db';
import { logger } from '@/lib/utils/logger';
import { sendEmail } from '@/lib/services/email';
import { sendSMS } from '@/lib/services/sms';
import { getNotificationPreferences } from '@/lib/services/reminders';

interface WaitlistEntryWithUser {
  id: number;
  user_id: number;
  preferred_date: string;
  preferred_time: string | null;
  service_id: number | null;
  dentist_id: number | null;
  status: string;
  auto_book: boolean;
  notified_at: string | null;
  created_at: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  service_name: string | null;
}

interface WaitlistProcessResult {
  processed: number;
  notified: number;
  autoBooked: number;
  errors: {
    waitlistId: number;
    message: string;
  }[];
  details: {
    waitlistId: number;
    userId: number;
    preferredDate: string;
    preferredTime: string | null;
    autoBooked: boolean;
    appointmentId?: number;
    channels: ('email' | 'sms')[];
  }[];
}

async function getActiveWaitlistEntries(): Promise<WaitlistEntryWithUser[]> {
  const result = await query(
    `SELECT 
       w.*, 
       u.email, 
       u.first_name, 
       u.last_name, 
       u.phone,
       s.name AS service_name
     FROM waitlist w
     JOIN users u ON w.user_id = u.id
     LEFT JOIN services s ON w.service_id = s.id
     WHERE w.status = 'active'
       AND w.preferred_date >= CURRENT_DATE
     ORDER BY w.preferred_date ASC, w.created_at ASC`
  );

  return result.rows as WaitlistEntryWithUser[];
}

// Check if a specific time slot is free for a waitlist entry
async function isPreferredSlotAvailable(entry: WaitlistEntryWithUser): Promise<boolean> {
  if (!entry.preferred_time) {
    return false;
  }

  let sql = `
    SELECT COUNT(*) AS count
    FROM appointments
    WHERE appointment_date = $1
      AND appointment_time = $2
      AND status != 'cancelled'
  `;
  const params: any[] = [entry.preferred_date, entry.preferred_time];

  if (entry.dentist_id) {
    sql += ' AND dentist_id = $3';
    params.push(entry.dentist_id);
  }

  const result = await query(sql, params);
  const count = parseInt(result.rows[0].count, 10);
  return count === 0;
}

// Check if there is any availability on the preferred date (for entries without specific time)
async function isAnySlotAvailableOnDate(entry: WaitlistEntryWithUser): Promise<boolean> {
  // Business hours configuration (same as chatbot slots)
  const BUSINESS_HOURS: Record<string, { start: string; end: string } | null> = {
    monday: { start: '09:00', end: '17:00' },
    tuesday: { start: '09:00', end: '17:00' },
    wednesday: { start: '09:00', end: '17:00' },
    thursday: { start: '09:00', end: '17:00' },
    friday: { start: '09:00', end: '15:00' },
    saturday: null,
    sunday: null,
  };

  const SLOT_DURATION = 30;
  const selectedDate = new Date(entry.preferred_date + 'T00:00:00');
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][selectedDate.getDay()];
  const hours = BUSINESS_HOURS[dayName];

  if (!hours) {
    return false;
  }

  const generateSlots = (start: string, end: string): string[] => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const slots: string[] = [];
    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
      currentMin += SLOT_DURATION;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
    return slots;
  };

  const allSlots = generateSlots(hours.start, hours.end);

  // Get booked appointments for that day
  let bookedQuery = `
    SELECT appointment_time, duration
    FROM appointments
    WHERE appointment_date = $1
      AND status != 'cancelled'
  `;
  const queryParams: any[] = [entry.preferred_date];

  if (entry.dentist_id) {
    bookedQuery += ' AND dentist_id = $2';
    queryParams.push(entry.dentist_id);
  }

  const bookedResult = await query(bookedQuery, queryParams);
  const bookedSlots = new Set<string>();

  bookedResult.rows.forEach((row) => {
    const [hour, min] = row.appointment_time.split(':').map(Number);
    const duration = row.duration || 30;
    const slotsNeeded = Math.ceil(duration / SLOT_DURATION);

    for (let i = 0; i < slotsNeeded; i++) {
      const slotMin = min + i * SLOT_DURATION;
      const slotHour = hour + Math.floor(slotMin / 60);
      const finalMin = slotMin % 60;
      bookedSlots.add(`${String(slotHour).padStart(2, '0')}:${String(finalMin).padStart(2, '0')}`);
    }
  });

  // Filter out past times if today
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isToday = entry.preferred_date === todayStr;
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const validSlots = isToday
    ? allSlots.filter((slot) => slot > currentTime)
    : allSlots;

  const availableSlots = validSlots.filter((slot) => !bookedSlots.has(slot));
  return availableSlots.length > 0;
}

async function markWaitlistNotified(
  entryId: number,
  status: 'notified' | 'converted'
): Promise<void> {
  await query(
    `UPDATE waitlist 
     SET status = $1, notified_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [status, entryId]
  );
}

export async function processWaitlistEntries(): Promise<WaitlistProcessResult> {
  const entries = await getActiveWaitlistEntries();

  const result: WaitlistProcessResult = {
    processed: entries.length,
    notified: 0,
    autoBooked: 0,
    errors: [],
    details: [],
  };

  for (const entry of entries) {
    try {
      const hasPreferredTime = !!entry.preferred_time;

      // Check availability based on whether a specific time was requested
      const hasAvailability = hasPreferredTime
        ? await isPreferredSlotAvailable(entry)
        : await isAnySlotAvailableOnDate(entry);

      if (!hasAvailability) {
        continue;
      }

      // Get notification preferences
      const preferences = await getNotificationPreferences(entry.user_id);

      const channels: ('email' | 'sms')[] = [];
      if (preferences.emailEnabled && entry.email) {
        channels.push('email');
      }
      if (preferences.smsEnabled && entry.phone) {
        channels.push('sms');
      }

      if (channels.length === 0) {
        // Nothing to send, skip but log
        logger.info('Waitlist entry has no valid notification channels', {
          waitlistId: entry.id,
          userId: entry.user_id,
        });
        continue;
      }

      let autoBookedAppointmentId: number | undefined;

      // If auto-book is enabled and we have an exact preferred time, create appointment directly
      if (entry.auto_book && hasPreferredTime) {
        const insertResult = await query(
          `INSERT INTO appointments
             (user_id, dentist_id, service_id, appointment_date, appointment_time, status)
           VALUES ($1, $2, $3, $4, $5, 'scheduled')
           RETURNING id`,
          [
            entry.user_id,
            entry.dentist_id,
            entry.service_id,
            entry.preferred_date,
            entry.preferred_time,
          ]
        );

        autoBookedAppointmentId = insertResult.rows[0]?.id;
        await markWaitlistNotified(entry.id, 'converted');
        result.autoBooked += 1;
      } else {
        // Only notify, don't auto-book
        await markWaitlistNotified(entry.id, 'notified');
      }

      const prettyDate = new Date(entry.preferred_date + 'T00:00:00').toLocaleDateString();
      const timeDisplay = entry.preferred_time
        ? entry.preferred_time.toString().slice(0, 5)
        : 'any available time';
      const serviceName = entry.service_name || 'your appointment';

      // Send notifications on configured channels
      for (const channel of channels) {
        if (channel === 'email' && entry.email) {
          const subject = autoBookedAppointmentId
            ? 'Good news! Your waitlisted appointment has been booked'
            : 'Good news! A waitlist slot is now available';

          const html = `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2563eb;">Hi ${entry.first_name || ''},</h2>
                  <p>
                    ${
                      autoBookedAppointmentId
                        ? `We have automatically booked ${serviceName} from your waitlist request.`
                        : `A slot has opened up for ${serviceName} from your waitlist request.`
                    }
                  </p>
                  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <ul style="list-style: none; padding: 0;">
                      <li style="margin: 10px 0;"><strong>Date:</strong> ${prettyDate}</li>
                      <li style="margin: 10px 0;"><strong>Time:</strong> ${timeDisplay}</li>
                    </ul>
                  </div>
                  <p>
                    ${
                      autoBookedAppointmentId
                        ? 'You can view or manage this appointment from your Upcoming Appointments page or chatbot.'
                        : 'You can now book this time from your dashboard or by asking the dental assistant chatbot.'
                    }
                  </p>
                  <p style="margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/appointments" 
                       style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      View Appointments
                    </a>
                  </p>
                  <p style="margin-top: 20px;">Best regards,<br><strong>Dental Tutor Team</strong></p>
                </div>
              </body>
            </html>
          `;

          const text = `
Hi ${entry.first_name || ''},

${autoBookedAppointmentId
  ? `We have automatically booked ${serviceName} from your waitlist request.`
  : `A slot has opened up for ${serviceName} from your waitlist request.`}

Date: ${prettyDate}
Time: ${timeDisplay}

${autoBookedAppointmentId
  ? 'You can view or manage this appointment from your Upcoming Appointments page or chatbot.'
  : 'You can now book this time from your dashboard or by asking the dental assistant chatbot.'}

Best regards,
Dental Tutor Team
          `;

          await sendEmail(entry.email, subject, html, text);
        }

        if (channel === 'sms' && entry.phone) {
          const message = autoBookedAppointmentId
            ? `Dental Tutor: Your waitlisted appointment on ${prettyDate} at ${timeDisplay} has been booked.`
            : `Dental Tutor: A slot is now available on ${prettyDate} at ${timeDisplay} from your waitlist. You can book it now.`;

          await sendSMS(entry.phone, message);
        }
      }

      result.notified += 1;
      result.details.push({
        waitlistId: entry.id,
        userId: entry.user_id,
        preferredDate: entry.preferred_date,
        preferredTime: entry.preferred_time,
        autoBooked: !!autoBookedAppointmentId,
        appointmentId: autoBookedAppointmentId,
        channels,
      });

      logger.info('Waitlist entry processed', {
        waitlistId: entry.id,
        userId: entry.user_id,
        autoBooked: !!autoBookedAppointmentId,
        appointmentId: autoBookedAppointmentId,
        channels,
      });
    } catch (error) {
      logger.error('Error processing waitlist entry', error as Error, {
        waitlistId: entry.id,
        userId: entry.user_id,
      });
      result.errors.push({
        waitlistId: entry.id,
        message: (error as Error).message,
      });
    }
  }

  return result;
}








