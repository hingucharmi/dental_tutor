import { logger } from '@/lib/utils/logger';

// Email service placeholder - integrate with SendGrid, AWS SES, or Nodemailer
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    // TODO: Integrate with actual email service
    // For now, just log the email
    logger.info('Email sent', { to, subject });
    console.log('Email would be sent:', { to, subject, html });
    return true;
  } catch (error) {
    logger.error('Email send error', error as Error);
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
      <body>
        <h2>Hi ${firstName},</h2>
        <p>This is a reminder that you have an appointment scheduled:</p>
        <ul>
          <li><strong>Date:</strong> ${appointmentDate}</li>
          <li><strong>Time:</strong> ${appointmentTime}</li>
          ${serviceName ? `<li><strong>Service:</strong> ${serviceName}</li>` : ''}
        </ul>
        <p>Please arrive 10 minutes early. If you need to reschedule or cancel, please contact us.</p>
        <p>Best regards,<br>Dental Tutor Team</p>
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
      <body>
        <h2>Hi ${firstName},</h2>
        <p>Thank you for visiting us on ${appointmentDate}!</p>
        <p>We'd love to hear about your experience. Please take a moment to share your feedback.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/feedback?appointment=${appointmentDate}">Share Your Feedback</a></p>
        <p>Best regards,<br>Dental Tutor Team</p>
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

