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

// Database configuration with improved defaults
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dental_tutor',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
};

// Warn if credentials are missing
if (!process.env.DB_PASSWORD) {
  console.warn('⚠️  Warning: DB_PASSWORD not set in .env.local');
  console.warn('   Using default user: ' + dbConfig.user);
  console.warn('   Please create .env.local with your database credentials');
}

const pool = new Pool(dbConfig);

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const migrationsDir = path.join(__dirname, '../database/migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
        console.log(`✓ Completed: ${file}`);
      }
    }

    await client.query('COMMIT');
    console.log('All migrations completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((error) => {
  console.error('Migration error:', error.message);
  
  // Provide helpful error messages
  if (error.code === '28P01') {
    console.error('\n❌ Database authentication failed!');
    console.error('   Please check your DB_USER and DB_PASSWORD in .env.local');
    console.error('   Make sure .env.local exists and has the correct credentials.');
  } else if (error.code === '3D000') {
    console.error('\n❌ Database does not exist!');
    console.error(`   Please create the database: createdb -U postgres ${dbConfig.database}`);
  } else if (error.code === 'ECONNREFUSED') {
    console.error('\n❌ Cannot connect to PostgreSQL!');
    console.error('   Please ensure PostgreSQL is running.');
  }
  
  process.exit(1);
});

