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

async function addDisplayOrderColumn() {
  const client = await pool.connect();
  try {
    console.log('Checking if display_order column exists in preparation_instructions table...');
    
    const colCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'preparation_instructions' 
      AND column_name = 'display_order';
    `);
    
    if (colCheck.rows.length > 0) {
      console.log('✓ display_order column already exists - no fix needed');
      return;
    }
    
    console.log('Adding display_order column...');
    
    await client.query(`
      ALTER TABLE preparation_instructions 
      ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
    `);
    
    console.log('✓ display_order column added successfully');
    
    // Update existing rows to have display_order based on id
    console.log('Updating existing rows with display_order values...');
    await client.query(`
      UPDATE preparation_instructions 
      SET display_order = id 
      WHERE display_order IS NULL OR display_order = 0;
    `);
    
    console.log('✓ Existing rows updated');
    console.log('\n✓ Fix completed!');
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addDisplayOrderColumn().catch((error) => {
  console.error('Failed:', error.message);
  process.exit(1);
});

