// Load environment variables from .env.local
const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config({ path: '.env.local' });
} catch (error) {
  // Fallback: manually load .env.local if dotenv is not available
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

async function createFormsTable() {
  const client = await pool.connect();
  try {
    console.log('Checking if forms table exists...');
    
    // Check if table exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'forms'
      );
    `);

    if (checkResult.rows[0].exists) {
      console.log('✓ Forms table already exists');
      return;
    }

    console.log('Creating forms table...');

    // Create the forms table
    await client.query(`
      CREATE TABLE forms (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
        form_type VARCHAR(100) NOT NULL,
        form_data JSONB NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'submitted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✓ Forms table created');

    // Create indexes
    await client.query(`
      CREATE INDEX idx_forms_user_id ON forms(user_id);
      CREATE INDEX idx_forms_appointment_id ON forms(appointment_id);
    `);

    console.log('✓ Indexes created');

    // Check if update_updated_at_column function exists
    const functionCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'update_updated_at_column'
      );
    `);

    if (functionCheck.rows[0].exists) {
      // Create trigger for updated_at
      await client.query(`
        CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
      console.log('✓ Trigger created');
    } else {
      console.log('⚠ Warning: update_updated_at_column() function not found');
      console.log('  Trigger not created. This is optional.');
    }

    console.log('\n✓ Forms table setup completed successfully!');
  } catch (error) {
    console.error('Error creating forms table:', error.message);
    if (error.code === '42P01') {
      console.error('\nNote: One of the referenced tables (users or appointments) might not exist.');
      console.error('Please run the initial migration first: npm run db:migrate');
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createFormsTable().catch((error) => {
  console.error('Failed:', error.message);
  process.exit(1);
});

