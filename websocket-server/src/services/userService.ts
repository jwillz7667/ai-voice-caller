import { PrismaClient } from '@prisma/client';

type User = any;
type Profile = any;
type TokenTransaction = any;
type TokenType = any;
import { AuthService } from '../lib/auth';
import { z } from 'zod';

const prisma = new PrismaClient();

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  username: z.string().min(3).max(30).optional(),
  name: z.string().max(100).optional(),
  phone: z.string().optional()
});

export const SigninSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const ProfileUpdateSchema = z.object({
  name: z.string().max(100).optional(),
  username: z.string().min(3).max(30).optional(),
  phone: z.string().optional(),
  fullName: z.string().max(100).optional(),
  displayName: z.string().max(50).optional(),
  phoneNumber: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  preferences: z.record(z.string(), z.any()).optional(),
  notificationPrefs: z.record(z.string(), z.any()).optional()
});

export type UserWithProfile = User & {
  profile: Profile | null;
};

export class UserService {
  static async createUser(data: z.infer<typeof SignupSchema>): Promise<UserWithProfile> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username }
        ]
      }
    });

    if (existingUser) {
      throw new Error('User already exists with this email or username');
    }

    const passwordHash = await AuthService.hashPassword(data.password);

    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          username: data.username,
          name: data.name,
          phone: data.phone,
          tokenBalance: 100, // Initial bonus tokens
          profile: {
            create: {
              preferences: {
                voice: 'marin',
                temperature: 0.8,
                model: 'gpt-realtime'
              }
            }
          },
          tokenTransactions: {
            create: {
              amount: 100,
              type: 'BONUS' as const,
              balance: 100,
              description: 'Welcome bonus tokens'
            }
          }
        },
        include: {
          profile: true
        }
      });

      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          action: 'USER_SIGNUP',
          entity: 'user',
          entityId: newUser.id,
          metadata: {
            email: newUser.email,
            username: newUser.username
          }
        }
      });

      return newUser;
    });

    return user;
  }

  static async authenticateUser(data: z.infer<typeof SigninSchema>): Promise<UserWithProfile> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { profile: true }
    });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Account is not active');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Account is temporarily locked');
    }

    const isValid = await AuthService.verifyPassword(data.password, user.passwordHash);

    if (!isValid) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: { increment: 1 },
          lockedUntil: user.failedLoginCount >= 4
            ? new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes after 5 failed attempts
            : undefined
        }
      });
      throw new Error('Invalid credentials');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
        failedLoginCount: 0,
        lockedUntil: null
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entity: 'user',
        entityId: user.id
      }
    });

    return user;
  }

  static async getUserById(userId: string): Promise<UserWithProfile | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });
  }

  static async updateProfile(
    userId: string,
    data: z.infer<typeof ProfileUpdateSchema>
  ): Promise<UserWithProfile> {
    const { name, username, phone, ...profileData } = data;

    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        throw new Error('Username already taken');
      }
    }

    const user = await prisma.$transaction(async (tx: any) => {
      if (name !== undefined || username !== undefined || phone !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(name !== undefined && { name }),
            ...(username !== undefined && { username }),
            ...(phone !== undefined && { phone })
          }
        });
      }

      if (Object.keys(profileData).length > 0) {
        await tx.profile.upsert({
          where: { userId },
          create: {
            userId,
            ...profileData
          },
          update: profileData
        });
      }

      return tx.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      });
    });

    if (!user) {
      throw new Error('User not found');
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PROFILE_UPDATE',
        entity: 'user',
        entityId: userId,
        newValues: data
      }
    });

    return user;
  }

  static async deductTokens(
    userId: string,
    amount: number,
    description: string,
    relatedCallId?: string
  ): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokenBalance: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.tokenBalance < amount) {
      throw new Error('Insufficient token balance');
    }

    const newBalance = user.tokenBalance - amount;

    await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: userId },
        data: { tokenBalance: newBalance }
      });

      await tx.tokenTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'USAGE' as const,
          balance: newBalance,
          description,
          relatedCallId,
          metadata: { timestamp: new Date().toISOString() }
        }
      });

      if (newBalance < 10) {
        await tx.notification.create({
          data: {
            userId,
            type: 'CREDITS_LOW',
            title: 'Low Token Balance',
            message: `Your token balance is low (${newBalance} tokens remaining). Consider purchasing more tokens.`
          }
        });
      }
    });

    return newBalance;
  }

  static async addTokens(
    userId: string,
    amount: number,
    type: TokenType,
    description: string,
    stripeSessionId?: string,
    stripePaymentId?: string
  ): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokenBalance: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const newBalance = user.tokenBalance + amount;

    await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: userId },
        data: { tokenBalance: newBalance }
      });

      await tx.tokenTransaction.create({
        data: {
          userId,
          amount,
          type,
          balance: newBalance,
          description,
          stripeSessionId,
          stripePaymentId,
          metadata: { timestamp: new Date().toISOString() }
        }
      });

      await tx.notification.create({
        data: {
          userId,
          type: 'PAYMENT_SUCCESS',
          title: 'Tokens Added',
          message: `Successfully added ${amount} tokens to your account. New balance: ${newBalance} tokens.`
        }
      });
    });

    return newBalance;
  }

  static async getTokenTransactions(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TokenTransaction[]> {
    return prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  static async createSession(userId: string, userAgent?: string, ip?: string): Promise<string> {
    const sessionToken = AuthService.generateSessionId();

    await prisma.session.create({
      data: {
        userId,
        sessionToken,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userAgent,
        ip
      }
    });

    return sessionToken;
  }

  static async validateSession(sessionToken: string): Promise<UserWithProfile | null> {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          include: { profile: true }
        }
      }
    });

    if (!session || session.expires < new Date()) {
      return null;
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivity: new Date() }
    });

    return session.user;
  }

  static async deleteSession(sessionToken: string): Promise<void> {
    await prisma.session.delete({
      where: { sessionToken }
    });
  }

  static async cleanup(): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        expires: { lt: new Date() }
      }
    });
  }
}