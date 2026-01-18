import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { users } from './db-supabase';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getUserIdFromRequest(): number | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) return null;
    
    const decoded = verifyToken(token);
    return decoded?.userId || null;
  } catch (error) {
    console.error('Error getting userId from request:', error);
    return null;
  }
}

export async function getUserFromRequest(): Promise<User | null> {
  const userId = getUserIdFromRequest();
  if (!userId) return null;

  const user = await users.findById(userId);
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    created_at: user.created_at
  };
}
