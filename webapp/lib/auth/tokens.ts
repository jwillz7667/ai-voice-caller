import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'development-secret';

export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateNumericToken(length: number = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

export function createJWT(payload: any, expiresIn: string = '7d'): string {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (_error) {
    throw new Error('Invalid or expired token');
  }
}

export function createRefreshToken(user_id: string): string {
  return jwt.sign(
    { user_id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function createAccessToken(user_id: string, email: string, role: string): string {
  return jwt.sign(
    { user_id, email, role, type: 'access' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

export function verifyRefreshToken(token: string): { user_id: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return { user_id: decoded.user_id };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}