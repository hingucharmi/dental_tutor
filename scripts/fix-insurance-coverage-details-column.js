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

async function addCoverageDetailsColumn() {
  const client = await pool.connect();
  try {
    console.log('Checking if coverage_details column exists in insurance_info table...');
    
    const colCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'insurance_info' 
      AND column_name = 'coverage_details';
    `);
    
    if (colCheck.rows.length > 0) {
      console.log('✓ coverage_details column already exists - no fix needed');
      return;
    }
    
    console.log('Adding coverage_details column...');
    
    await client.query(`
      ALTER TABLE insurance_info 
      ADD COLUMN IF NOT EXISTS coverage_details JSONB;
    `);
    
    console.log('✓ coverage_details column added successfully');
    console.log('\n✓ Fix completed!');
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addCoverageDetailsColumn().catch((error) => {
  console.error('Failed:', error.message);
  process.exit(1);
});

