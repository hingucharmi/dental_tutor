-- Add fields to track reschedule and cancel counts
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS reschedule_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancel_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_been_rescheduled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_been_cancelled BOOLEAN DEFAULT FALSE;

-- Create index for checking duplicate appointments
CREATE INDEX IF NOT EXISTS idx_appointments_user_service_date ON appointments(user_id, service_id, appointment_date) 
WHERE status != 'cancelled';

