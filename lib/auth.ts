import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { dataStore } from './data';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function authenticateRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  console.log('Auth header:', authHeader); // Debug log
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No valid auth header found');
    return null;
  }

  const token = authHeader.substring(7);
  console.log('Extracted token:', token.substring(0, 20) + '...'); // Debug log (partial token)
  
  const payload = verifyToken(token);
  if (!payload) {
    console.log('Token verification failed');
    return null;
  }

  console.log('Token payload:', payload); // Debug log
  
  const user = await dataStore.findUserById(payload.userId);
  if (!user) {
    console.log('User not found for ID:', payload.userId);
    return null;
  }

  console.log('Authentication successful for user:', user.email);
  return user.id;
}