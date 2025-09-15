import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../lib/auth';
import StripeService, { TOKEN_PACKAGES } from '../services/stripeService';
import { z } from 'zod';

const router = Router();

const PurchaseSchema = z.object({
  packageId: z.string(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
});

router.get('/packages', (_req: Request, res: Response) => {
  res.json({ packages: TOKEN_PACKAGES });
});

router.post('/checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const data = PurchaseSchema.parse(req.body);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const successUrl = data.successUrl || `${baseUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = data.cancelUrl || `${baseUrl}/purchase/cancel`;

    const sessionUrl = await StripeService.createCheckoutSession(
      req.user.sub,
      data.packageId,
      successUrl,
      cancelUrl
    );

    res.json({ url: sessionUrl });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors
      });
      return;
    }

    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

router.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    res.status(400).json({ error: 'No signature provided' });
    return;
  }

  try {
    const result = await StripeService.handleWebhook(req.body, signature);

    if (result.success) {
      res.json({ received: true });
    } else {
      res.status(400).json({ error: result.message || 'Webhook processing failed' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/portal', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: req.user.sub }
    });

    if (!user || !user.stripeCustomerId) {
      res.status(400).json({ error: 'No billing account found' });
      return;
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const returnUrl = req.query.returnUrl as string || `${baseUrl}/settings`;

    const portalUrl = await StripeService.createCustomerPortalSession(
      user.stripeCustomerId,
      returnUrl
    );

    res.json({ url: portalUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: req.user.sub }
    });

    if (!user || !user.stripeCustomerId) {
      res.json({ transactions: [] });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const transactions = await StripeService.getTransactionHistory(user.stripeCustomerId, limit);

    res.json({
      transactions: transactions.map(charge => ({
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        description: charge.description,
        status: charge.status,
        created: charge.created,
        refunded: charge.refunded,
        refundAmount: charge.amount_refunded
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

export default router;