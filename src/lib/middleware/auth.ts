import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from '@/lib/utils/errors';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

export function verifyToken(token: string): AuthUser {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    const decoded = jwt.verify(token, secret) as AuthUser;
    return decoded;
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token');
  }
}

export function getAuthUser(req: NextRequest): AuthUser | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function requireAuth(req: NextRequest): AuthUser {
  const user = getAuthUser(req);
  if (!user) {
    throw new AuthenticationError('Authentication required');
  }
  return user;
}

export function requireRole(req: NextRequest, ...allowedRoles: string[]): AuthUser {
  const user = requireAuth(req);
  if (!allowedRoles.includes(user.role)) {
    throw new AuthenticationError('Insufficient permissions');
  }
  return user;
}

