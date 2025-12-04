import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'dental_tutor',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased from 2000 to 10000 (10 seconds)
      statement_timeout: 30000, // 30 seconds for query execution
      query_timeout: 30000, // 30 seconds for query timeout
    };

    // Warn if using default values (except for host/port/database which have safe defaults)
    if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
      console.warn(
        '⚠️  Database credentials not set in environment variables.\n' +
        'Please create a .env.local file with DB_USER and DB_PASSWORD.\n' +
        'Using defaults: user=' + dbConfig.user + ', password=' + (dbConfig.password ? '***' : 'NOT SET')
      );
    }

    pool = new Pool(dbConfig);

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  return pool;
}

export async function query(text: string, params?: any[]) {
  const pool = getPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Only log queries in development if DB_DEBUG is enabled
    if (process.env.DB_DEBUG === 'true' && process.env.NODE_ENV !== 'production') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error: any) {
    console.error('Database query error', { text, error });
    
    // Provide more helpful error messages for common connection issues
    if (error?.code === '28P01') {
      throw new Error(
        'Database authentication failed. Please check your DB_USER and DB_PASSWORD in .env.local'
      );
    }
    if (error?.code === '3D000') {
      throw new Error(
        `Database "${process.env.DB_NAME || 'dental_tutor'}" does not exist. Please create it first.`
      );
    }
    if (error?.code === 'ECONNREFUSED') {
      throw new Error(
        `Cannot connect to PostgreSQL at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}. ` +
        'Please ensure PostgreSQL is running.'
      );
    }
    if (error?.code === '42P01') {
      const tableName = error?.message?.match(/relation "(\w+)"/)?.[1] || 'table';
      throw new Error(
        `Database table "${tableName}" does not exist. ` +
        `Run: npm run db:migrate or npm run db:create-forms-table (for forms table)`
      );
    }
    if (error?.message?.includes('timeout') || error?.message?.includes('Connection terminated')) {
      throw new Error(
        'Database connection timeout. The database may be slow or unavailable. ' +
        'Please try again later or check your database connection settings.'
      );
    }
    
    throw error;
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

