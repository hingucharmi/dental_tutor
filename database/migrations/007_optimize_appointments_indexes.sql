-- Add composite indexes for better query performance on appointments table
-- These indexes optimize common query patterns

-- Index for user appointments with date filtering (used in upcoming/history queries)
CREATE INDEX IF NOT EXISTS idx_appointments_user_date_status 
ON appointments(user_id, appointment_date, status);

-- Index for date and time lookups (used in slot availability checks)
CREATE INDEX IF NOT EXISTS idx_appointments_date_time_status 
ON appointments(appointment_date, appointment_time, status);

-- Index for dentist appointments (if dentist_id is used)
CREATE INDEX IF NOT EXISTS idx_appointments_dentist_date 
ON appointments(dentist_id, appointment_date) 
WHERE dentist_id IS NOT NULL;

-- Index for service lookups
CREATE INDEX IF NOT EXISTS idx_appointments_service_id 
ON appointments(service_id) 
WHERE service_id IS NOT NULL;

