import { Router, Request, Response } from 'express';
import { AuthService, authMiddleware, rateLimiter, AuthRequest } from '../lib/auth';
import { UserService, SignupSchema, SigninSchema, ProfileUpdateSchema } from '../services/userService';
import { z } from 'zod';

const router = Router();

router.post('/signup', rateLimiter(5, 60000), async (req: Request, res: Response) => {
  try {
    const data = SignupSchema.parse(req.body);
    const user = await UserService.createUser(data);

    const accessToken = AuthService.generateAccessToken({
      sub: user.id,
      email: user.email,
      tokenBalance: user.tokenBalance,
      role: user.role
    });

    const refreshToken = AuthService.generateRefreshToken(user.id);
    const sessionToken = await UserService.createSession(
      user.id,
      req.headers['user-agent'],
      req.ip
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.cookie('sessionToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        tokenBalance: user.tokenBalance,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/signin', rateLimiter(10, 60000), async (req: Request, res: Response) => {
  try {
    const data = SigninSchema.parse(req.body);
    const user = await UserService.authenticateUser(data);

    const accessToken = AuthService.generateAccessToken({
      sub: user.id,
      email: user.email,
      tokenBalance: user.tokenBalance,
      role: user.role
    });

    const refreshToken = AuthService.generateRefreshToken(user.id);
    const sessionToken = await UserService.createSession(
      user.id,
      req.headers['user-agent'],
      req.ip
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie('sessionToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        tokenBalance: user.tokenBalance,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message.includes('Invalid credentials') || error.message.includes('locked')) {
        res.status(401).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({ error: 'No refresh token provided' });
      return;
    }

    const payload = AuthService.verifyRefreshToken(refreshToken);
    const user = await UserService.getUserById(payload.sub);

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const accessToken = AuthService.generateAccessToken({
      sub: user.id,
      email: user.email,
      tokenBalance: user.tokenBalance,
      role: user.role
    });

    const newRefreshToken = AuthService.generateRefreshToken(user.id);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionToken } = req.cookies;

    if (sessionToken) {
      await UserService.deleteSession(sessionToken);
    }

    res.clearCookie('refreshToken');
    res.clearCookie('sessionToken');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout' });
  }
});

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await UserService.getUserById(req.user.sub);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      phone: user.phone,
      tokenBalance: user.tokenBalance,
      role: user.role,
      profile: user.profile,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.patch('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const data = ProfileUpdateSchema.parse(req.body);
    const user = await UserService.updateProfile(req.user.sub, data);

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      phone: user.phone,
      tokenBalance: user.tokenBalance,
      role: user.role,
      profile: user.profile,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message.includes('already taken')) {
        res.status(409).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/transactions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const transactions = await UserService.getTokenTransactions(req.user.sub, limit, offset);

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.get('/session', async (req: Request, res: Response) => {
  try {
    const { sessionToken } = req.cookies;

    if (!sessionToken) {
      res.status(401).json({ error: 'No session' });
      return;
    }

    const user = await UserService.validateSession(sessionToken);

    if (!user) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      tokenBalance: user.tokenBalance,
      role: user.role,
      profile: user.profile
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate session' });
  }
});

export default router;