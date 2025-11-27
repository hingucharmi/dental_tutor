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
const bcrypt = require('bcryptjs');

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

async function seedDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create a test patient user
    const patientPasswordHash = await bcrypt.hash('password123', 10);
    const patientResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['patient@example.com', patientPasswordHash, 'John', 'Doe', '555-0100', 'patient', true]
    );

    // Create a test dentist user
    const dentistPasswordHash = await bcrypt.hash('password123', 10);
    const dentistUserResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['dentist@example.com', dentistPasswordHash, 'Dr. Jane', 'Smith', '555-0200', 'dentist', true]
    );

    // Create dentist profile if dentist user was created
    if (dentistUserResult.rows.length > 0) {
      const dentistUserId = dentistUserResult.rows[0].id;
      await client.query(
        `INSERT INTO dentists (user_id, specialization, bio, availability_schedule)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [
          dentistUserId,
          'General Dentistry',
          'Experienced general dentist with 10+ years of practice.',
          JSON.stringify({
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
            thursday: { start: '09:00', end: '17:00' },
            friday: { start: '09:00', end: '15:00' },
          }),
        ]
      );
    }

    // Seed services
    const seedSql = require('fs').readFileSync(
      require('path').join(__dirname, '../database/seeds/001_initial_data.sql'),
      'utf8'
    );
    await client.query(seedSql);

    await client.query('COMMIT');
    console.log('✓ Seed data created successfully!');
    console.log('Test accounts:');
    console.log('  Patient: patient@example.com / password123');
    console.log('  Dentist: dentist@example.com / password123');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase().catch((error) => {
  console.error('Seed error:', error.message);
  
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
  } else if (error.code === '42P01') {
    console.error('\n❌ Database tables do not exist!');
    console.error('   Please run migrations first: npm run db:migrate');
  }
  
  process.exit(1);
});

