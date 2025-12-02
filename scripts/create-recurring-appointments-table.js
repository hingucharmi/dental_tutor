// Load environment variables from .env.local
const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config({ path: '.env.local' });
} catch (error) {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
  }
}

const { Pool } = require('pg');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dental_tutor',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
};

const pool = new Pool(dbConfig);

async function createRecurringAppointmentsTable() {
  const client = await pool.connect();
  try {
    console.log('Checking if recurring_appointments table exists...');
    
    // Check if table exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recurring_appointments'
      );
    `);

    if (checkResult.rows[0].exists) {
      console.log('✓ Table exists, checking columns...');
      
      // Check existing columns
      const columns = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'recurring_appointments'
        ORDER BY ordinal_position;
      `);
      
      const existingColumns = columns.rows.map(r => r.column_name);
      console.log('Existing columns:', existingColumns.join(', '));
      
      // Add missing columns if needed
      if (!existingColumns.includes('day_of_week')) {
        console.log('Adding day_of_week column...');
        await client.query(`
          ALTER TABLE recurring_appointments 
          ADD COLUMN IF NOT EXISTS day_of_week INTEGER;
        `);
        console.log('✓ Added day_of_week');
      }
      
      if (!existingColumns.includes('day_of_month')) {
        console.log('Adding day_of_month column...');
        await client.query(`
          ALTER TABLE recurring_appointments 
          ADD COLUMN IF NOT EXISTS day_of_month INTEGER;
        `);
        console.log('✓ Added day_of_month');
      }
      
      if (!existingColumns.includes('recurrence_interval')) {
        console.log('Adding recurrence_interval column...');
        await client.query(`
          ALTER TABLE recurring_appointments 
          ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1;
        `);
        console.log('✓ Added recurrence_interval');
      }
      
      // Check if time_slot is NOT NULL and make it nullable or add default
      if (existingColumns.includes('time_slot')) {
        const timeSlotInfo = await client.query(`
          SELECT is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = 'recurring_appointments' 
          AND column_name = 'time_slot';
        `);
        
        if (timeSlotInfo.rows.length > 0 && timeSlotInfo.rows[0].is_nullable === 'NO' && !timeSlotInfo.rows[0].column_default) {
          console.log('Making time_slot nullable or adding default...');
          await client.query(`
            ALTER TABLE recurring_appointments 
            ALTER COLUMN time_slot DROP NOT NULL;
          `);
          await client.query(`
            ALTER TABLE recurring_appointments 
            ALTER COLUMN time_slot SET DEFAULT '09:00';
          `);
          console.log('✓ Updated time_slot column');
        }
      }
      
    } else {
      console.log('Creating recurring_appointments table...');
      
      await client.query(`
        CREATE TABLE recurring_appointments (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          service_id INTEGER REFERENCES services(id),
          dentist_id INTEGER,
          recurrence_pattern VARCHAR(50) NOT NULL,
          recurrence_interval INTEGER DEFAULT 1,
          day_of_week INTEGER,
          day_of_month INTEGER,
          start_date DATE NOT NULL,
          end_date DATE,
          duration INTEGER DEFAULT 30,
          status VARCHAR(50) DEFAULT 'active',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✓ Table created');
      
      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_recurring_appointments_user_id ON recurring_appointments(user_id);
        CREATE INDEX IF NOT EXISTS idx_recurring_appointments_status ON recurring_appointments(status);
      `);
      
      console.log('✓ Indexes created');
      
      // Create trigger if function exists
      const functionCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public' 
          AND p.proname = 'update_updated_at_column'
        );
      `);
      
      if (functionCheck.rows[0].exists) {
        await client.query(`
          DROP TRIGGER IF EXISTS update_recurring_appointments_updated_at ON recurring_appointments;
          CREATE TRIGGER update_recurring_appointments_updated_at BEFORE UPDATE ON recurring_appointments
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);
        console.log('✓ Trigger created');
      }
    }

    console.log('\n✓ Recurring appointments table setup completed!');
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createRecurringAppointmentsTable().catch((error) => {
  console.error('Failed:', error.message);
  process.exit(1);
});

