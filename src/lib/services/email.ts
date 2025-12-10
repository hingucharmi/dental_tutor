import { logger } from '@/lib/utils/logger';

// Email service with multiple provider support
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    const emailProvider = process.env.EMAIL_PROVIDER || 'sendgrid'; // sendgrid, ses, nodemailer

    switch (emailProvider.toLowerCase()) {
      case 'sendgrid':
        return await sendEmailViaSendGrid(to, subject, html, text);
      case 'ses':
        return await sendEmailViaSES(to, subject, html, text);
      case 'nodemailer':
        return await sendEmailViaNodemailer(to, subject, html, text);
      default:
        logger.warn('Unknown email provider, using SendGrid', { provider: emailProvider });
        return await sendEmailViaSendGrid(to, subject, html, text);
    }
  } catch (error) {
    logger.error('Email send error', error as Error);
    return false;
  }
}

// SendGrid implementation
async function sendEmailViaSendGrid(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      logger.warn('SendGrid API key not configured, logging email instead');
      logger.info('Email would be sent via SendGrid', { to, subject });
      return true; // Return true in dev mode
    }

    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@dentaltutor.com',
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
      html,
    };

    await sgMail.send(msg);
    logger.info('Email sent via SendGrid', { to, subject });
    return true;
  } catch (error) {
    logger.error('SendGrid email error', error as Error);
    return false;
  }
}

// AWS SES implementation
async function sendEmailViaSES(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    if (!process.env.AWS_SES_REGION || !process.env.AWS_ACCESS_KEY_ID) {
      logger.warn('AWS SES not configured, logging email instead');
      logger.info('Email would be sent via SES', { to, subject });
      return true; // Return true in dev mode
    }

    const AWS = require('aws-sdk');
    const ses = new AWS.SES({
      region: process.env.AWS_SES_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    const params = {
      Source: process.env.SES_FROM_EMAIL || 'noreply@dentaltutor.com',
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
          Text: {
            Data: text || html.replace(/<[^>]*>/g, ''),
            Charset: 'UTF-8',
          },
        },
      },
    };

    await ses.sendEmail(params).promise();
    logger.info('Email sent via AWS SES', { to, subject });
    return true;
  } catch (error) {
    logger.error('AWS SES email error', error as Error);
    return false;
  }
}

// Nodemailer implementation (for SMTP)
async function sendEmailViaNodemailer(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    if (!process.env.SMTP_HOST) {
      logger.warn('SMTP not configured, logging email instead');
      logger.info('Email would be sent via SMTP', { to, subject });
      return true; // Return true in dev mode
    }

    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@dentaltutor.com',
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html,
    };

    await transporter.sendMail(mailOptions);
    logger.info('Email sent via Nodemailer/SMTP', { to, subject });
    return true;
  } catch (error) {
    logger.error('Nodemailer email error', error as Error);
    return false;
  }
}

export function generateAppointmentReminderEmail(
  firstName: string,
  appointmentDate: string,
  appointmentTime: string,
  serviceName?: string
): { subject: string; html: string; text: string } {
  const subject = 'Appointment Reminder - Dental Tutor';
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Hi ${firstName},</h2>
          <p>This is a reminder that you have an appointment scheduled:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0;"><strong>Date:</strong> ${appointmentDate}</li>
              <li style="margin: 10px 0;"><strong>Time:</strong> ${appointmentTime}</li>
              ${serviceName ? `<li style="margin: 10px 0;"><strong>Service:</strong> ${serviceName}</li>` : ''}
            </ul>
          </div>
          <p>Please arrive 10 minutes early. If you need to reschedule or cancel, please contact us.</p>
          <p style="margin-top: 30px;">Best regards,<br><strong>Dental Tutor Team</strong></p>
        </div>
      </body>
    </html>
  `;
  const text = `
    Hi ${firstName},
    
    This is a reminder that you have an appointment scheduled:
    Date: ${appointmentDate}
    Time: ${appointmentTime}
    ${serviceName ? `Service: ${serviceName}` : ''}
    
    Please arrive 10 minutes early. If you need to reschedule or cancel, please contact us.
    
    Best regards,
    Dental Tutor Team
  `;

  return { subject, html, text };
}

export function generateFollowUpEmail(
  firstName: string,
  appointmentDate: string
): { subject: string; html: string; text: string } {
  const subject = 'How was your visit? - Dental Tutor';
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Hi ${firstName},</h2>
          <p>Thank you for visiting us on ${appointmentDate}!</p>
          <p>We'd love to hear about your experience. Please take a moment to share your feedback.</p>
          <p style="margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/feedback?appointment=${appointmentDate}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Share Your Feedback
            </a>
          </p>
          <p>Best regards,<br><strong>Dental Tutor Team</strong></p>
        </div>
      </body>
    </html>
  `;
  const text = `
    Hi ${firstName},
    
    Thank you for visiting us on ${appointmentDate}!
    
    We'd love to hear about your experience. Please take a moment to share your feedback.
    
    Best regards,
    Dental Tutor Team
  `;

  return { subject, html, text };
}
