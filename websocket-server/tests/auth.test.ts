import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../src/lib/auth';
import authRouter from '../src/routes/auth';
import cookieParser from 'cookie-parser';

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/auth', authRouter);

describe('Authentication API', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    username: 'testuser',
    name: 'Test User'
  };

  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    });
    await prisma.$disconnect();
  });

  describe('POST /signup', () => {
    it('should create a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.username).toBe(testUser.username);
      expect(response.body.user.tokenBalance).toBe(100); // Initial bonus
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(testUser)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          ...testUser,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation error');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          ...testUser,
          email: 'weak@example.com',
          password: '123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('POST /signin', () => {
    it('should authenticate with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signin')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signin')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should increment failed login count', async () => {
      // Make multiple failed attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/auth/signin')
          .send({
            email: testUser.email,
            password: 'WrongPassword'
          })
          .expect(401);
      }

      const user = await prisma.user.findUnique({
        where: { email: testUser.email }
      });

      expect(user?.failedLoginCount).toBeGreaterThan(0);
    });
  });

  describe('GET /profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/auth/signin')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      accessToken = response.body.accessToken;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body.email).toBe(testUser.email);
      expect(response.body).toHaveProperty('tokenBalance');
    });

    it('should reject request without token', async () => {
      await request(app)
        .get('/api/v1/auth/profile')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('PATCH /profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/auth/signin')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      accessToken = response.body.accessToken;
    });

    it('should update profile with valid data', async () => {
      const updates = {
        name: 'Updated Name',
        fullName: 'Updated Full Name',
        phoneNumber: '+1234567890'
      };

      const response = await request(app)
        .patch('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe(updates.name);
      expect(response.body.profile.fullName).toBe(updates.fullName);
      expect(response.body.profile.phoneNumber).toBe(updates.phoneNumber);
    });

    it('should reject duplicate username', async () => {
      // Create another user
      await prisma.user.create({
        data: {
          email: 'another@example.com',
          username: 'anotheruser',
          passwordHash: 'hash'
        }
      });

      const response = await request(app)
        .patch('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'anotheruser'
        })
        .expect(409);

      expect(response.body.error).toContain('already taken');

      // Clean up
      await prisma.user.delete({
        where: { email: 'another@example.com' }
      });
    });
  });

  describe('Token Management', () => {
    it('should verify access token correctly', () => {
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
        tokenBalance: 100,
        role: 'USER'
      };

      const token = AuthService.generateAccessToken(payload);
      const verified = AuthService.verifyAccessToken(token);

      expect(verified.sub).toBe(payload.sub);
      expect(verified.email).toBe(payload.email);
      expect(verified.tokenBalance).toBe(payload.tokenBalance);
      expect(verified.role).toBe(payload.role);
    });

    it('should reject expired token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.invalid';

      expect(() => {
        AuthService.verifyAccessToken(token);
      }).toThrow('Invalid or expired token');
    });

    it('should hash and verify passwords correctly', async () => {
      const password = 'SecurePassword123!';
      const hash = await AuthService.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);

      const isValid = await AuthService.verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await AuthService.verifyPassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit signup attempts', async () => {
      // Make 5 rapid signup attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/signup')
          .send({
            email: `test${i}@example.com`,
            password: 'Password123!'
          });
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'test6@example.com',
          password: 'Password123!'
        })
        .expect(429);

      expect(response.body.error).toContain('Too many requests');
    });
  });
});

describe('Token Transactions', () => {
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'token-test@example.com',
        passwordHash: 'hash',
        tokenBalance: 100
      }
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({
      where: { id: userId }
    });
  });

  it('should deduct tokens correctly', async () => {
    const { deductTokens } = await import('../src/services/userService');

    const newBalance = await deductTokens(userId, 10, 'Test deduction');

    expect(newBalance).toBe(90);

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    expect(user?.tokenBalance).toBe(90);

    const transaction = await prisma.tokenTransaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    expect(transaction?.amount).toBe(-10);
    expect(transaction?.balance).toBe(90);
    expect(transaction?.type).toBe('USAGE');
  });

  it('should prevent overdraft', async () => {
    const { deductTokens } = await import('../src/services/userService');

    await expect(
      deductTokens(userId, 1000, 'Overdraft attempt')
    ).rejects.toThrow('Insufficient token balance');

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Balance should remain unchanged
    expect(user?.tokenBalance).toBe(90);
  });

  it('should add tokens correctly', async () => {
    const { addTokens } = await import('../src/services/userService');

    const newBalance = await addTokens(
      userId,
      50,
      'PURCHASE' as any,
      'Test purchase',
      'session-id',
      'payment-id'
    );

    expect(newBalance).toBe(140);

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    expect(user?.tokenBalance).toBe(140);

    const transaction = await prisma.tokenTransaction.findFirst({
      where: {
        userId,
        type: 'PURCHASE'
      },
      orderBy: { createdAt: 'desc' }
    });

    expect(transaction?.amount).toBe(50);
    expect(transaction?.balance).toBe(140);
    expect(transaction?.stripeSessionId).toBe('session-id');
  });
});