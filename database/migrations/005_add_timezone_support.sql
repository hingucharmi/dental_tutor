-- Add timezone column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'timezone'
    ) THEN
        ALTER TABLE users ADD COLUMN timezone VARCHAR(100) DEFAULT 'UTC';
    END IF;
END $$;

-- Add unique constraint to notifications table for idempotency
-- This prevents duplicate reminders for the same appointment/channel/day
DO $$
BEGIN
    -- Create a unique index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_notifications_unique_reminder'
    ) THEN
        CREATE UNIQUE INDEX idx_notifications_unique_reminder 
        ON notifications (user_id, type, channel, (metadata->>'appointmentId'), (metadata->>'reminderHours'), DATE(sent_at))
        WHERE type = 'appointment_reminder';
    END IF;
END $$;

-- Add index for faster reminder queries
CREATE INDEX IF NOT EXISTS idx_notifications_appointment_reminder 
ON notifications (user_id, type, (metadata->>'appointmentId'), sent_at)
WHERE type = 'appointment_reminder';

