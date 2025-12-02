-- Recurring appointments table
CREATE TABLE IF NOT EXISTS recurring_appointments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id),
  dentist_id INTEGER,
  recurrence_pattern VARCHAR(50) NOT NULL, -- daily, weekly, biweekly, monthly
  recurrence_interval INTEGER DEFAULT 1,
  day_of_week INTEGER, -- 0-6 (Sunday-Saturday) for weekly patterns
  day_of_month INTEGER, -- 1-31 for monthly patterns
  start_date DATE NOT NULL,
  end_date DATE,
  duration INTEGER DEFAULT 30,
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Symptom assessments table
CREATE TABLE IF NOT EXISTS symptom_assessments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255) UNIQUE,
  symptoms JSONB NOT NULL,
  urgency_score INTEGER DEFAULT 0,
  recommendations TEXT,
  triage_result VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Preparation instructions table
CREATE TABLE IF NOT EXISTS preparation_instructions (
  id SERIAL PRIMARY KEY,
  service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insurance information table
CREATE TABLE IF NOT EXISTS insurance_info (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_name VARCHAR(255) NOT NULL,
  policy_number VARCHAR(100),
  group_number VARCHAR(100),
  subscriber_name VARCHAR(255),
  subscriber_dob DATE,
  relationship VARCHAR(50),
  verification_status VARCHAR(50) DEFAULT 'pending',
  verified_at TIMESTAMP,
  coverage_details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Care instructions table
CREATE TABLE IF NOT EXISTS care_instructions (
  id SERIAL PRIMARY KEY,
  treatment_type VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  duration_days INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  quantity INTEGER,
  refills_remaining INTEGER DEFAULT 0,
  prescribed_date DATE NOT NULL,
  expiry_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescription refill requests table
CREATE TABLE IF NOT EXISTS prescription_refills (
  id SERIAL PRIMARY KEY,
  prescription_id INTEGER NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'pending',
  approved_at TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Treatment plans table
CREATE TABLE IF NOT EXISTS treatment_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  progress_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Treatment plan items table
CREATE TABLE IF NOT EXISTS treatment_plan_items (
  id SERIAL PRIMARY KEY,
  treatment_plan_id INTEGER NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id),
  description TEXT NOT NULL,
  scheduled_date DATE,
  completed_date DATE,
  status VARCHAR(50) DEFAULT 'pending',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews/Feedback table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  dentist_id INTEGER REFERENCES dentists(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dentist profiles enhancement (if not exists, add to existing)
ALTER TABLE dentists ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE dentists ADD COLUMN IF NOT EXISTS specialties TEXT[];
ALTER TABLE dentists ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE dentists ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE dentists ADD COLUMN IF NOT EXISTS languages TEXT[];

-- Service pricing table
CREATE TABLE IF NOT EXISTS service_pricing (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  base_price DECIMAL(10, 2) NOT NULL,
  insurance_price DECIMAL(10, 2),
  cash_price DECIMAL(10, 2),
  effective_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dental care tips table
CREATE TABLE IF NOT EXISTS dental_tips (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FAQ table
CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to existing faqs table if they don't exist
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

-- Emergency contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  available_24_7 BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Urgent appointment requests table
CREATE TABLE IF NOT EXISTS urgent_appointments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferred_date DATE,
  preferred_time TIME,
  service_id INTEGER REFERENCES services(id),
  urgency_reason TEXT NOT NULL,
  symptoms TEXT,
  priority_score INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  assigned_to INTEGER REFERENCES dentists(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pain management content table
CREATE TABLE IF NOT EXISTS pain_management_content (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  pain_level_min INTEGER DEFAULT 1,
  pain_level_max INTEGER DEFAULT 10,
  recommendations TEXT,
  escalation_threshold INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles enhancement
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_history JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS allergies TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);

-- Family members table
CREATE TABLE IF NOT EXISTS family_members (
  id SERIAL PRIMARY KEY,
  account_owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  relationship VARCHAR(50),
  medical_history JSONB,
  allergies TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add account_owner_id column if table exists without it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_members') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'family_members' AND column_name = 'account_owner_id') THEN
      ALTER TABLE family_members ADD COLUMN account_owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
      -- Update existing rows if any (set to a default user or handle as needed)
      -- ALTER TABLE family_members ALTER COLUMN account_owner_id SET NOT NULL;
    END IF;
  END IF;
END $$;

-- Appointment confirmations table
CREATE TABLE IF NOT EXISTS appointment_confirmations (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  confirmation_method VARCHAR(50), -- email, sms, phone
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  calendar_file_url TEXT,
  status VARCHAR(50) DEFAULT 'sent'
);

-- Alerts table (weather/closure)
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL, -- weather, closure, maintenance
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  priority VARCHAR(50) DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add is_active column if table exists without it
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Promotional offers table
CREATE TABLE IF NOT EXISTS promotional_offers (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(50), -- percentage, fixed_amount
  discount_value DECIMAL(10, 2),
  service_id INTEGER REFERENCES services(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add is_active column if table exists without it
ALTER TABLE promotional_offers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recurring_appointments_user_id ON recurring_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_appointments_status ON recurring_appointments(status);
CREATE INDEX IF NOT EXISTS idx_symptom_assessments_user_id ON symptom_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_assessments_session_id ON symptom_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_preparation_instructions_service_id ON preparation_instructions(service_id);
CREATE INDEX IF NOT EXISTS idx_insurance_info_user_id ON insurance_info(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_prescription_refills_user_id ON prescription_refills(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_user_id ON treatment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_plan_id ON treatment_plan_items(treatment_plan_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_dentist_id ON reviews(dentist_id);
CREATE INDEX IF NOT EXISTS idx_urgent_appointments_user_id ON urgent_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_urgent_appointments_status ON urgent_appointments(status);
-- Create index only if table and column exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_members') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'family_members' AND column_name = 'account_owner_id') THEN
      CREATE INDEX IF NOT EXISTS idx_family_members_owner_id ON family_members(account_owner_id);
    END IF;
  END IF;
END $$;
-- Create indexes conditionally (only if columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alerts') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'is_active') THEN
      CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON alerts(is_active);
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotional_offers') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'promotional_offers' AND column_name = 'is_active') THEN
      CREATE INDEX IF NOT EXISTS idx_promotional_offers_is_active ON promotional_offers(is_active);
    END IF;
  END IF;
END $$;

-- Create triggers for updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_recurring_appointments_updated_at ON recurring_appointments;
CREATE TRIGGER update_recurring_appointments_updated_at BEFORE UPDATE ON recurring_appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_preparation_instructions_updated_at ON preparation_instructions;
CREATE TRIGGER update_preparation_instructions_updated_at BEFORE UPDATE ON preparation_instructions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_insurance_info_updated_at ON insurance_info;
CREATE TRIGGER update_insurance_info_updated_at BEFORE UPDATE ON insurance_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON prescriptions;
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prescription_refills_updated_at ON prescription_refills;
CREATE TRIGGER update_prescription_refills_updated_at BEFORE UPDATE ON prescription_refills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_treatment_plans_updated_at ON treatment_plans;
CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON treatment_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_treatment_plan_items_updated_at ON treatment_plan_items;
CREATE TRIGGER update_treatment_plan_items_updated_at BEFORE UPDATE ON treatment_plan_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_pricing_updated_at ON service_pricing;
CREATE TRIGGER update_service_pricing_updated_at BEFORE UPDATE ON service_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dental_tips_updated_at ON dental_tips;
CREATE TRIGGER update_dental_tips_updated_at BEFORE UPDATE ON dental_tips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emergency_contacts_updated_at ON emergency_contacts;
CREATE TRIGGER update_emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_urgent_appointments_updated_at ON urgent_appointments;
CREATE TRIGGER update_urgent_appointments_updated_at BEFORE UPDATE ON urgent_appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pain_management_content_updated_at ON pain_management_content;
CREATE TRIGGER update_pain_management_content_updated_at BEFORE UPDATE ON pain_management_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_family_members_updated_at ON family_members;
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alerts_updated_at ON alerts;
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promotional_offers_updated_at ON promotional_offers;
CREATE TRIGGER update_promotional_offers_updated_at BEFORE UPDATE ON promotional_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

