import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/utils/logger';
import { addCorsHeaders } from '@/lib/middleware/cors';

const preferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  appointmentReminders: z.boolean().optional(),
  appointmentReminderHours: z.number().optional(),
  followUpEnabled: z.boolean().optional(),
  marketingEnabled: z.boolean().optional(),
});

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);

    const result = await query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [user.id]
    );

    if (result.rows.length === 0) {
      // Return default preferences if none exist
      return NextResponse.json({
        success: true,
        data: {
          preferences: {
            emailEnabled: true,
            smsEnabled: false,
            pushEnabled: true,
            appointmentReminders: true,
            appointmentReminderHours: 24,
            followUpEnabled: true,
            marketingEnabled: false,
          },
        },
      });
    }

    const row = result.rows[0];
    const preferences = {
      emailEnabled: row.email_enabled,
      smsEnabled: row.sms_enabled,
      pushEnabled: row.push_enabled,
      appointmentReminders: row.appointment_reminders,
      appointmentReminderHours: row.appointment_reminder_hours,
      followUpEnabled: row.follow_up_enabled,
      marketingEnabled: row.marketing_enabled,
    };

    const response = NextResponse.json({
      success: true,
      data: { preferences },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const body = await req.json();
    const data = preferencesSchema.parse(body);

    // Check if preferences exist
    const existing = await query(
      'SELECT id FROM notification_preferences WHERE user_id = $1',
      [user.id]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing preferences
      result = await query(
        `UPDATE notification_preferences 
         SET email_enabled = COALESCE($1, email_enabled),
             sms_enabled = COALESCE($2, sms_enabled),
             push_enabled = COALESCE($3, push_enabled),
             appointment_reminders = COALESCE($4, appointment_reminders),
             appointment_reminder_hours = COALESCE($5, appointment_reminder_hours),
             follow_up_enabled = COALESCE($6, follow_up_enabled),
             marketing_enabled = COALESCE($7, marketing_enabled)
         WHERE user_id = $8
         RETURNING *`,
        [
          data.emailEnabled,
          data.smsEnabled,
          data.pushEnabled,
          data.appointmentReminders,
          data.appointmentReminderHours,
          data.followUpEnabled,
          data.marketingEnabled,
          user.id,
        ]
      );
    } else {
      // Create new preferences
      result = await query(
        `INSERT INTO notification_preferences 
         (user_id, email_enabled, sms_enabled, push_enabled, appointment_reminders, 
          appointment_reminder_hours, follow_up_enabled, marketing_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          user.id,
          data.emailEnabled ?? true,
          data.smsEnabled ?? false,
          data.pushEnabled ?? true,
          data.appointmentReminders ?? true,
          data.appointmentReminderHours ?? 24,
          data.followUpEnabled ?? true,
          data.marketingEnabled ?? false,
        ]
      );
    }

    const row = result.rows[0];
    const preferences = {
      emailEnabled: row.email_enabled,
      smsEnabled: row.sms_enabled,
      pushEnabled: row.push_enabled,
      appointmentReminders: row.appointment_reminders,
      appointmentReminderHours: row.appointment_reminder_hours,
      followUpEnabled: row.follow_up_enabled,
      marketingEnabled: row.marketing_enabled,
    };

    logger.info('Notification preferences updated', { userId: user.id });

    const response = NextResponse.json({
      success: true,
      data: { preferences },
    });

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    logger.error('Update preferences error', error as Error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}

