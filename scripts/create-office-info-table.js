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

async function createOfficeInfoTable() {
  const client = await pool.connect();
  try {
    console.log('Checking if office_info table exists...');
    
    // Check if table exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'office_info'
      );
    `);

    if (checkResult.rows[0].exists) {
      console.log('✓ office_info table already exists.');
      return;
    }

    console.log('Creating office_info table...');

    // Create the table
    await client.query(`
      CREATE TABLE office_info (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100),
        state VARCHAR(100),
        zip_code VARCHAR(20),
        country VARCHAR(100) DEFAULT 'USA',
        phone VARCHAR(20),
        email VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        parking_info TEXT,
        office_hours JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✓ office_info table created successfully.');

    // Check if the update_updated_at_column function exists
    const functionCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'update_updated_at_column'
      );
    `);

    if (functionCheck.rows[0].exists) {
      console.log('Creating trigger for updated_at...');
      await client.query(`
        DROP TRIGGER IF EXISTS update_office_info_updated_at ON office_info;
        CREATE TRIGGER update_office_info_updated_at 
        BEFORE UPDATE ON office_info
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
      console.log('✓ Trigger created successfully.');
    } else {
      console.log('⚠ Warning: update_updated_at_column function not found. Trigger not created.');
      console.log('  Run migrations to create the function first.');
    }

    console.log('\n✓ office_info table setup completed!');
  } catch (error) {
    console.error('✗ Error creating office_info table:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createOfficeInfoTable().catch((error) => {
  console.error('Script error:', error.message);
  
  if (error.code === '28P01') {
    console.error('\n❌ Database authentication failed!');
    console.error('   Please check your DB_USER and DB_PASSWORD in .env.local');
  } else if (error.code === '3D000') {
    console.error('\n❌ Database does not exist!');
    console.error(`   Please create the database: createdb -U postgres ${dbConfig.database}`);
  } else if (error.code === 'ECONNREFUSED') {
    console.error('\n❌ Cannot connect to PostgreSQL!');
    console.error('   Please ensure PostgreSQL is running.');
  }
  
  process.exit(1);
});

