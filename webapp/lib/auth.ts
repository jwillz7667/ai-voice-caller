import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { User } from '@prisma/client';

// Re-export NextAuth v5 utilities
export { auth, signIn, signOut, handlers } from './auth/index';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  user_id: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export async function createSession(user_id: string, email: string): Promise<string> {
  const token = generateToken({ user_id, email });
  
  // Store session in database
  await prisma.sessions.create({ data: {
        id: crypto.randomUUID(), user_id,
      session_token: token,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days,
        created_at: new Date(),
        updated_at: new Date()
      },
  });
  
  return token;
}

export async function validateSession(token: string): Promise<User | null> {
  try {
    // Verify JWT token
    verifyToken(token);

    // Check if session exists in database
    const session = await prisma.sessions.findUnique({
      where: { session_token: token },
      include: { users: true },
    });

    if (!session || session.expires < new Date()) {
      return null;
    }

    return session.user;
  } catch {
    return null;
  }
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.sessions.delete({
    where: { session_token: token },
  }).catch(() => {
    // Ignore if session doesn't exist
  });
}

export async function cleanupExpiredSessions(): Promise<void> {
  await prisma.sessions.deleteMany({
    where: {
      expires: {
        lt: new Date(),
      },
    },
  });
}