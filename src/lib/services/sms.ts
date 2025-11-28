import { logger } from '@/lib/utils/logger';

// SMS service placeholder - integrate with Twilio or AWS SNS
export async function sendSMS(
  to: string,
  message: string
): Promise<boolean> {
  try {
    // TODO: Integrate with actual SMS service
    // For now, just log the SMS
    logger.info('SMS sent', { to });
    console.log('SMS would be sent:', { to, message });
    return true;
  } catch (error) {
    logger.error('SMS send error', error as Error);
    return false;
  }
}

export function generateAppointmentReminderSMS(
  firstName: string,
  appointmentDate: string,
  appointmentTime: string
): string {
  return `Hi ${firstName}, reminder: You have an appointment on ${appointmentDate} at ${appointmentTime}. Please arrive 10 min early. Dental Tutor`;
}

export function generateFollowUpSMS(firstName: string): string {
  return `Hi ${firstName}, thank you for visiting! We'd love your feedback: ${process.env.NEXT_PUBLIC_APP_URL}/feedback - Dental Tutor`;
}

