# Appointment Reminders - Cron Setup Guide

This guide explains how to set up automated appointment reminders using cron jobs.

## Overview

The appointment reminder system processes reminders every 5-15 minutes by calling the `/api/reminders/process` endpoint. This endpoint:
- Finds appointments needing reminders based on user preferences
- Sends reminders via Email/SMS/P


ush based on user preferences
- Handles timezone conversions
- Prevents duplicate reminders (idempotency)

## Setup Options

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/reminders/process",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

This runs every 10 minutes. Adjust schedule as needed:
- `*/5 * * * *` - Every 5 minutes
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour

### Option 2: External Cron Service (cron-job.org, EasyCron, etc.)

1. Sign up for a cron service
2. Create a new cron job
3. Set schedule: `*/10 * * * *` (every 10 minutes)
4. Set URL: `https://your-domain.com/api/reminders/process`
5. Set method: POST
6. Add header: `Authorization: Bearer YOUR_CRON_SECRET`

### Option 3: Server Cron (Linux/Mac)

Add to crontab (`crontab -e`):

```bash
*/10 * * * * curl -X POST https://your-domain.com/api/reminders/process -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Option 4: Node.js Cron Package

Install `node-cron`:

```bash
npm install node-cron
```

Create `scripts/cron.js`:

```javascript
const cron = require('node-cron');
const https = require('https');

cron.schedule('*/10 * * * *', () => {
  const options = {
    hostname: 'your-domain.com',
    path: '/api/reminders/process',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Reminder cron job executed: ${res.statusCode}`);
  });

  req.on('error', (error) => {
    console.error('Cron job error:', error);
  });

  req.end();
});
```

Run: `node scripts/cron.js`

## Environment Variables

Add to `.env.local`:

```bash
# Cron Security
CRON_SECRET=your-secure-random-secret-key-here

# Email Provider (choose one)
EMAIL_PROVIDER=sendgrid  # Options: sendgrid, ses, nodemailer

# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# AWS SES Configuration (alternative)
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
SES_FROM_EMAIL=noreply@yourdomain.com

# SMTP Configuration (alternative)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com

# SMS Provider (choose one)
SMS_PROVIDER=twilio  # Options: twilio, sns

# Twilio Configuration
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# AWS SNS Configuration (alternative)
AWS_SNS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Timezone Configuration
CLINIC_TIMEZONE=America/New_York  # Your clinic's timezone
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Testing

Test the endpoint manually:

```bash
curl -X POST https://your-domain.com/api/reminders/process \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "processed": 5,
    "remindersSent": 3,
    "errors": 0,
    "details": {
      "remindersSent": [...],
      "errors": []
    }
  }
}
```

## Monitoring

Monitor cron job execution:
1. Check application logs for reminder processing
2. Monitor email/SMS provider dashboards
3. Check database `notifications` table for sent reminders
4. Set up alerts for failed cron jobs

## Troubleshooting

### Reminders not sending
- Check `CRON_SECRET` matches in cron job and environment
- Verify email/SMS provider credentials
- Check user notification preferences are enabled
- Review application logs for errors

### Duplicate reminders
- System uses idempotency keys to prevent duplicates
- Check `notifications` table for existing reminders
- Verify timezone settings are correct

### Timezone issues
- Set `CLINIC_TIMEZONE` environment variable
- Ensure user timezones are stored in database
- Check reminder time calculations in logs

## Waitlist processing (slots opening)

To support **waitlist notifications** (\"Join waitlist for preferred time slots, get notified when slots open\"), the app exposes a separate cron endpoint:

- `POST /api/waitlist/process` – scans active waitlist entries and:
  - Checks if the preferred time (or any time that day) is currently available
  - Sends Email/SMS notifications based on user notification preferences
  - If `autoBook` was enabled and an exact preferred time exists, automatically books the appointment and marks the waitlist entry as converted

### Cron setup (same pattern as reminders)

- **Vercel `vercel.json` example**:

```json
{
  "crons": [
    {
      "path": "/api/reminders/process",
      "schedule": "*/10 * * * *"
    },
    {
      "path": "/api/waitlist/process",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

- **External cron / server cron** (example):

```bash
*/10 * * * * curl -X POST https://your-domain.com/api/waitlist/process -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Testing waitlist processing

```bash
curl -X POST https://your-domain.com/api/waitlist/process \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

You should get a JSON response indicating how many waitlist entries were processed, how many users were notified, and how many were auto-booked.

