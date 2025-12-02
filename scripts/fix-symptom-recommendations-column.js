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

async function fixRecommendationsColumn() {
  const client = await pool.connect();
  try {
    console.log('Checking recommendations column type...');
    
    const colCheck = await client.query(`
      SELECT data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'symptom_assessments' 
      AND column_name = 'recommendations';
    `);
    
    if (colCheck.rows.length === 0) {
      console.log('✗ Column not found');
      return;
    }
    
    const dataType = colCheck.rows[0].data_type;
    const udtName = colCheck.rows[0].udt_name;
    
    console.log(`Current type: ${dataType} (${udtName})`);
    
    if (dataType === 'ARRAY' || udtName === '_text' || udtName === '_varchar') {
      console.log('Fixing column type from ARRAY to TEXT...');
      
      // First, clear any existing data if needed
      await client.query('UPDATE symptom_assessments SET recommendations = NULL WHERE recommendations IS NOT NULL');
      
      // Change column type
      await client.query(`
        ALTER TABLE symptom_assessments 
        ALTER COLUMN recommendations TYPE TEXT;
      `);
      
      console.log('✓ Column type fixed to TEXT');
    } else if (dataType === 'text' || dataType === 'character varying') {
      console.log('✓ Column type is already TEXT - no fix needed');
    } else {
      console.log(`⚠ Unexpected type: ${dataType}. Attempting to change to TEXT...`);
      await client.query(`
        ALTER TABLE symptom_assessments 
        ALTER COLUMN recommendations TYPE TEXT USING recommendations::text;
      `);
      console.log('✓ Column type changed to TEXT');
    }
    
    console.log('\n✓ Fix completed!');
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixRecommendationsColumn().catch((error) => {
  console.error('Failed:', error.message);
  process.exit(1);
});

