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

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'dental_tutor',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
};

const pool = new Pool(dbConfig);

async function seedFAQs() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Read and execute the FAQ seed file
    const seedSql = fs.readFileSync(
      path.join(__dirname, '../database/seeds/004_faqs_static_data.sql'),
      'utf8'
    );
    
    await client.query(seedSql);

    await client.query('COMMIT');
    console.log('✓ FAQ seed data created successfully!');
    
    // Count FAQs by category
    const result = await client.query('SELECT category, COUNT(*) as count FROM faqs GROUP BY category ORDER BY category');
    console.log('\nFAQs by category:');
    result.rows.forEach(row => {
      console.log(`  ${row.category || 'uncategorized'}: ${row.count} FAQs`);
    });
    
    const totalResult = await client.query('SELECT COUNT(*) as total FROM faqs');
    console.log(`\nTotal FAQs: ${totalResult.rows[0].total}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('FAQ seed failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedFAQs().catch((error) => {
  console.error('Seed error:', error.message);
  process.exit(1);
});

