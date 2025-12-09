import { query } from '@/lib/db';
import { logger } from '@/lib/utils/logger';

interface CreateNotificationParams {
  userId: number;
  type: string;
  channel: 'in-app' | 'email' | 'sms' | 'push';
  title: string;
  content: string;
  metadata?: any;
}

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  type,
  channel,
  title,
  content,
  metadata,
}: CreateNotificationParams): Promise<boolean> {
  try {
    await query(
      `INSERT INTO notifications (user_id, type, channel, title, content, metadata, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'sent')`,
      [userId, type, channel, title, content, metadata ? JSON.stringify(metadata) : null]
    );

    logger.info('Notification created', { userId, type, channel });
    return true;
  } catch (error) {
    logger.error('Failed to create notification', error as Error);
    return false;
  }
}

/**
 * Create notifications for recurring appointment creation
 */
export async function notifyRecurringAppointmentCreated(
  userId: number,
  appointmentDetails: {
    serviceName?: string;
    recurrencePattern: string;
    startDate: string;
    timeSlot: string;
  }
): Promise<void> {
  const { serviceName, recurrencePattern, startDate, timeSlot } = appointmentDetails;

  const patterns: { [key: string]: string } = {
    daily: 'daily',
    weekly: 'weekly',
    biweekly: 'every 2 weeks',
    monthly: 'monthly',
  };

  const patternText = patterns[recurrencePattern] || recurrencePattern;
  const serviceText = serviceName || 'General appointment';

  await createNotification({
    userId,
    type: 'recurring_appointment_created',
    channel: 'in-app',
    title: 'Recurring Appointment Scheduled',
    content: `Your ${patternText} ${serviceText.toLowerCase()} has been scheduled starting ${new Date(startDate).toLocaleDateString()} at ${formatTime(timeSlot)}.`,
    metadata: { recurrencePattern, startDate, timeSlot, serviceName },
  });
}

/**
 * Create notifications for recurring appointment updates
 */
export async function notifyRecurringAppointmentUpdated(
  userId: number,
  appointmentDetails: {
    serviceName?: string;
    recurrencePattern: string;
    status?: string;
  }
): Promise<void> {
  const { serviceName, recurrencePattern, status } = appointmentDetails;
  const serviceText = serviceName || 'recurring appointment';

  let contentText = `Your ${serviceText} schedule has been updated.`;
  if (status) {
    contentText = `Your ${serviceText} has been ${status}.`;
  }

  await createNotification({
    userId,
    type: 'recurring_appointment_updated',
    channel: 'in-app',
    title: 'Recurring Appointment Updated',
    content: contentText,
    metadata: { recurrencePattern, status, serviceName },
  });
}

/**
 * Create notifications for recurring appointment deletion
 */
export async function notifyRecurringAppointmentDeleted(
  userId: number,
  appointmentDetails: {
    serviceName?: string;
    recurrencePattern: string;
  }
): Promise<void> {
  const { serviceName, recurrencePattern } = appointmentDetails;
  const serviceText = serviceName || 'recurring appointment';

  await createNotification({
    userId,
    type: 'recurring_appointment_deleted',
    channel: 'in-app',
    title: 'Recurring Appointment Cancelled',
    content: `Your ${serviceText} schedule has been cancelled by your dentist.`,
    metadata: { recurrencePattern, serviceName },
  });
}

/**
 * Format time for display
 */
function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

