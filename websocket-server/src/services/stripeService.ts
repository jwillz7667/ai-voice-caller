import Stripe from 'stripe';
import { TokenType } from '@prisma/client';
import UserService from './userService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia'
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number; // in cents
  priceId?: string;
  popular?: boolean;
}

export const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    tokens: 100,
    price: 999, // $9.99
    priceId: process.env.STRIPE_PRICE_STARTER
  },
  {
    id: 'standard',
    name: 'Standard Pack',
    tokens: 500,
    price: 3999, // $39.99
    priceId: process.env.STRIPE_PRICE_STANDARD,
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium Pack',
    tokens: 1200,
    price: 8999, // $89.99
    priceId: process.env.STRIPE_PRICE_PREMIUM
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    tokens: 5000,
    price: 34999, // $349.99
    priceId: process.env.STRIPE_PRICE_ENTERPRISE
  }
];

export class StripeService {
  static async createCheckoutSession(
    userId: string,
    packageId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const tokenPackage = TOKEN_PACKAGES.find(p => p.id === packageId);

    if (!tokenPackage) {
      throw new Error('Invalid package selected');
    }

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = tokenPackage.priceId
      ? {
          price: tokenPackage.priceId,
          quantity: 1
        }
      : {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tokenPackage.name,
              description: `${tokenPackage.tokens} voice call tokens`,
              metadata: {
                tokens: tokenPackage.tokens.toString()
              }
            },
            unit_amount: tokenPackage.price
          },
          quantity: 1
        };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId,
        packageId,
        tokens: tokenPackage.tokens.toString()
      },
      payment_intent_data: {
        metadata: {
          userId,
          packageId,
          tokens: tokenPackage.tokens.toString()
        }
      }
    });

    return session.url || '';
  }

  static async createCustomerPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<string> {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });

    return session.url;
  }

  static async handleWebhook(
    body: string | Buffer,
    signature: string
  ): Promise<{ success: boolean; message?: string }> {
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return { success: false, message: 'Invalid signature' };
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          await this.handleSuccessfulPayment(session);
          break;
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.log('Payment succeeded:', paymentIntent.id);
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await this.handleFailedPayment(paymentIntent);
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log('Subscription event:', subscription.id);
          break;
        }

        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          await this.handleRefund(charge);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling webhook:', error);
      return { success: false, message: 'Failed to process webhook' };
    }
  }

  private static async handleSuccessfulPayment(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.client_reference_id;
    const tokens = parseInt(session.metadata?.tokens || '0');

    if (!userId || tokens === 0) {
      console.error('Invalid session metadata:', session.id);
      return;
    }

    try {
      await UserService.addTokens(
        userId,
        tokens,
        TokenType.PURCHASE,
        `Purchased ${tokens} tokens`,
        session.id,
        session.payment_intent as string
      );

      console.log(`Successfully added ${tokens} tokens to user ${userId}`);
    } catch (error) {
      console.error('Failed to add tokens after successful payment:', error);
      // Consider implementing a retry mechanism or dead letter queue
      throw error;
    }
  }

  private static async handleFailedPayment(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const userId = paymentIntent.metadata?.userId;

    if (!userId) {
      return;
    }

    console.log(`Payment failed for user ${userId}:`, paymentIntent.id);
    // Could create a notification for the user about the failed payment
  }

  private static async handleRefund(charge: Stripe.Charge): Promise<void> {
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
      return;
    }

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const userId = paymentIntent.metadata?.userId;
      const tokens = parseInt(paymentIntent.metadata?.tokens || '0');

      if (!userId || tokens === 0) {
        return;
      }

      const refundAmount = Math.floor((charge.amount_refunded / charge.amount) * tokens);

      if (refundAmount > 0) {
        await UserService.deductTokens(
          userId,
          refundAmount,
          `Refund for charge ${charge.id}`,
          undefined
        );

        console.log(`Refunded ${refundAmount} tokens from user ${userId}`);
      }
    } catch (error) {
      console.error('Failed to process refund:', error);
    }
  }

  static async createOrUpdateCustomer(userId: string, email: string): Promise<string> {
    const customers = await stripe.customers.list({
      email,
      limit: 1
    });

    if (customers.data.length > 0) {
      return customers.data[0].id;
    }

    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId
      }
    });

    return customer.id;
  }

  static async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    });

    return paymentMethods.data;
  }

  static async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    return stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });
  }

  static async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    return stripe.paymentMethods.detach(paymentMethodId);
  }

  static async createSetupIntent(customerId: string): Promise<string> {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card']
    });

    return setupIntent.client_secret || '';
  }

  static async getTransactionHistory(
    customerId: string,
    limit: number = 10
  ): Promise<Stripe.Charge[]> {
    const charges = await stripe.charges.list({
      customer: customerId,
      limit
    });

    return charges.data;
  }
}

export default StripeService;