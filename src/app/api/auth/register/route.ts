import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { hashPassword, validatePassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';
import { logger } from '@/lib/utils/logger';
import { ValidationError } from '@/lib/utils/errors';
import { corsHandler, addCorsHeaders } from '@/lib/middleware/cors';

export async function OPTIONS(req: NextRequest) {
  const corsResponse = corsHandler(req);
  return corsResponse || new NextResponse(null, { status: 200 });
}

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Validate password strength
    const passwordValidation = validatePassword(validatedData.password);
    if (!passwordValidation.valid) {
      throw new ValidationError(passwordValidation.error || 'Invalid password');
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [validatedData.email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role`,
      [
        validatedData.email,
        passwordHash,
        validatedData.firstName,
        validatedData.lastName,
        validatedData.phone || null,
        'patient',
      ]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info('User registered', { userId: user.id, email: user.email });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
          },
          token,
        },
      },
      { status: 201 }
    );

    return addCorsHeaders(response, req);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Check for specific error types and provide helpful messages
    const errorMessage = (error as any)?.message || '';
    const errorCode = (error as any)?.code;

    // Database connection errors
    if (errorMessage.includes('authentication failed') || errorCode === '28P01') {
      logger.error('Database authentication error', error as Error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed. Please check your database credentials in .env.local and restart the server.' 
        },
        { status: 500 }
      );
    }

    // Database doesn't exist
    if (errorMessage.includes('does not exist') && errorCode === '3D000') {
      logger.error('Database not found', error as Error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database not found. Please create the database and run migrations: npm run db:migrate' 
        },
        { status: 500 }
      );
    }

    // Table doesn't exist
    if (errorMessage.includes('table does not exist') || errorCode === '42P01') {
      logger.error('Database table missing', error as Error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database tables not found. Please run migrations: npm run db:migrate' 
        },
        { status: 500 }
      );
    }

    // JWT secret missing
    if (errorMessage.includes('JWT_SECRET')) {
      logger.error('JWT configuration error', error as Error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'JWT_SECRET is not configured. Please add it to .env.local' 
        },
        { status: 500 }
      );
    }

    // Connection refused
    if (errorMessage.includes('ECONNREFUSED') || errorCode === 'ECONNREFUSED') {
      logger.error('Database connection refused', error as Error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot connect to database. Please ensure PostgreSQL is running.' 
        },
        { status: 500 }
      );
    }

    logger.error('Registration error', error as Error);
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage || 'Registration failed',
        details: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
      },
      { status: 500 }
    );
  }
}

