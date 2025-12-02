-- Ensure role column exists in users table
-- Add role column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'patient';

-- Update any existing users without a role to 'patient'
UPDATE users SET role = 'patient' WHERE role IS NULL;

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

