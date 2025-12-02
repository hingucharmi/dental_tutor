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

async function createSymptomAssessmentsTable() {
  const client = await pool.connect();
  try {
    console.log('Checking if symptom_assessments table exists...');
    
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'symptom_assessments'
      );
    `);

    if (checkResult.rows[0].exists) {
      console.log('✓ Table already exists');
      
      // Check columns
      const columns = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'symptom_assessments'
        ORDER BY ordinal_position;
      `);
      console.log('Columns:', columns.rows.map(r => r.column_name).join(', '));
    } else {
      console.log('Creating symptom_assessments table...');
      
      await client.query(`
        CREATE TABLE symptom_assessments (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          session_id VARCHAR(255) UNIQUE,
          symptoms JSONB NOT NULL,
          urgency_score INTEGER DEFAULT 0,
          recommendations TEXT,
          triage_result VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Check if recommendations column exists and fix its type if needed
      const colCheck = await client.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'symptom_assessments' 
        AND column_name = 'recommendations';
      `);
      
      if (colCheck.rows.length > 0 && colCheck.rows[0].data_type === 'ARRAY') {
        console.log('Fixing recommendations column type from ARRAY to TEXT...');
        await client.query(`
          ALTER TABLE symptom_assessments 
          ALTER COLUMN recommendations TYPE TEXT USING recommendations::text;
        `);
        console.log('✓ Fixed recommendations column type');
      }
      
      console.log('✓ Table created');
      
      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_symptom_assessments_user_id ON symptom_assessments(user_id);
        CREATE INDEX IF NOT EXISTS idx_symptom_assessments_session_id ON symptom_assessments(session_id);
      `);
      
      console.log('✓ Indexes created');
    }

    console.log('\n✓ Symptom assessments table setup completed!');
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createSymptomAssessmentsTable().catch((error) => {
  console.error('Failed:', error.message);
  process.exit(1);
});

