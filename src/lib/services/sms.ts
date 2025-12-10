import { logger } from '@/lib/utils/logger';

// SMS service with multiple provider support
export async function sendSMS(
  to: string,
  message: string
): Promise<boolean> {
  try {
    const smsProvider = process.env.SMS_PROVIDER || 'twilio'; // twilio, sns

    switch (smsProvider.toLowerCase()) {
      case 'twilio':
        return await sendSMSViaTwilio(to, message);
      case 'sns':
        return await sendSMSViaSNS(to, message);
      default:
        logger.warn('Unknown SMS provider, using Twilio', { provider: smsProvider });
        return await sendSMSViaTwilio(to, message);
    }
  } catch (error) {
    logger.error('SMS send error', error as Error);
    return false;
  }
}

// Twilio implementation
async function sendSMSViaTwilio(to: string, message: string): Promise<boolean> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      logger.warn('Twilio not configured, logging SMS instead');
      logger.info('SMS would be sent via Twilio', { to, message });
      return true; // Return true in dev mode
    }

    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Format phone number (ensure it starts with +)
    const formattedTo = to.startsWith('+') ? to : `+${to.replace(/[^0-9]/g, '')}`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedTo,
    });

    logger.info('SMS sent via Twilio', { to: formattedTo });
    return true;
  } catch (error) {
    logger.error('Twilio SMS error', error as Error);
    return false;
  }
}

// AWS SNS implementation
async function sendSMSViaSNS(to: string, message: string): Promise<boolean> {
  try {
    if (!process.env.AWS_SNS_REGION || !process.env.AWS_ACCESS_KEY_ID) {
      logger.warn('AWS SNS not configured, logging SMS instead');
      logger.info('SMS would be sent via SNS', { to, message });
      return true; // Return true in dev mode
    }

    const AWS = require('aws-sdk');
    const sns = new AWS.SNS({
      region: process.env.AWS_SNS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    // Format phone number (ensure it starts with +)
    const formattedTo = to.startsWith('+') ? to : `+${to.replace(/[^0-9]/g, '')}`;

    const params = {
      PhoneNumber: formattedTo,
      Message: message,
    };

    await sns.publish(params).promise();
    logger.info('SMS sent via AWS SNS', { to: formattedTo });
    return true;
  } catch (error) {
    logger.error('AWS SNS SMS error', error as Error);
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
