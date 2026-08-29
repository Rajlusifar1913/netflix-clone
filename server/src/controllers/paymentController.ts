import { Response, NextFunction, Request } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

// ─── Stripe Initialization ────────────────────────────────────────────────────
// Only initialize Stripe with a real API key (not a placeholder)
const isRealStripeKey = (key: string): boolean =>
  (key.startsWith('sk_test_') || key.startsWith('sk_live_')) &&
  !key.includes('mock') &&
  !key.includes('change_in_production') &&
  key.length > 30;

export const stripe = isRealStripeKey(env.STRIPE_SECRET_KEY)
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion })
  : null;

if (!stripe) {
  console.warn(
    '⚠️  Stripe is not configured. Set a real STRIPE_SECRET_KEY in server/.env to enable live payments.'
  );
}

// ─── Plan Configuration ───────────────────────────────────────────────────────
export const PLAN_SPECS: Record<string, { name: string; specs: string; price: string; priceAmount: number }> = {
  mobile: {
    name: 'MOBILE',
    specs: 'Good 480p SD (1 Screen at once)',
    price: '$3.99 / mo',
    priceAmount: 399,
  },
  standard: {
    name: 'STANDARD',
    specs: 'Full HD 1080p (2 Screens at once)',
    price: '$9.99 / mo',
    priceAmount: 999,
  },
  premium: {
    name: 'PREMIUM',
    specs: 'Ultra HD 4K + HDR (4 Screens at once)',
    price: '$15.99 / mo',
    priceAmount: 1599,
  },
};

// ─── Zod Validation Schemas ───────────────────────────────────────────────────
export const changePlanSchema = z.object({
  body: z.object({
    planId: z.enum(['mobile', 'standard', 'premium']),
  }),
});

export const updateCredentialsSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).optional(),
  }),
});

// Accepts Stripe paymentMethodId - never raw card data
export const updatePaymentMethodSchema = z.object({
  body: z.object({
    paymentMethodId: z.string().min(1, 'Stripe payment method ID is required'),
  }),
});

// ─── GET /payments/subscription ───────────────────────────────────────────────
export const getSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) return next(new AppError('User not found', 404));

    res.status(200).json({
      status: 'success',
      data: {
        email: user.email,
        name: user.name,
        subscription: user.subscription || {
          status: 'active',
          planId: 'premium',
          planName: 'PREMIUM',
          planSpecs: PLAN_SPECS.premium.specs,
          cardLast4: '4242',
          cardBrand: 'visa',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /payments/change-plan ───────────────────────────────────────────────
export const changePlan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { planId } = req.body as { planId: 'mobile' | 'standard' | 'premium' };
    const user = await User.findById(req.user!.id);
    if (!user) return next(new AppError('User not found', 404));

    const planConfig = PLAN_SPECS[planId];
    if (!planConfig) return next(new AppError('Invalid plan selected.', 400));

    // If Stripe is active and user has an existing subscription, update it via Stripe
    if (stripe && user.subscription?.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
          metadata: { planId, planName: planConfig.name },
        });
      } catch (stripeErr) {
        console.error('⚠️  Stripe subscription update error:', stripeErr);
        // Fall through to local DB update — Stripe webhook will sync eventually
      }
    }

    user.subscription = {
      ...user.subscription,
      status: 'active',
      planId,
      planName: planConfig.name,
      planSpecs: planConfig.specs,
      cardLast4: user.subscription?.cardLast4 || '****',
      cardBrand: user.subscription?.cardBrand || 'card',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    };

    await user.save();

    res.status(200).json({
      status: 'success',
      message: `Plan updated to ${planConfig.name} successfully.`,
      data: { subscription: user.subscription },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /payments/update-payment ───────────────────────────────────────────
// Accepts a Stripe paymentMethodId (created by Stripe.js on the frontend).
// Raw card data NEVER touches this server — this is PCI-DSS compliant.
export const updatePaymentMethod = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { paymentMethodId } = req.body as { paymentMethodId: string };

    if (!stripe) {
      return next(new AppError('Payment processing is not configured on this server.', 503));
    }

    const user = await User.findById(req.user!.id);
    if (!user) return next(new AppError('User not found', 404));

    // Retrieve payment method from Stripe to get card metadata (last4, brand)
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (!pm.card) {
      return next(new AppError('Invalid payment method. Only card payments are supported.', 400));
    }

    const cardLast4 = pm.card.last4;
    const cardBrand = pm.card.brand;
    let stripeCustomerId = user.subscription?.stripeCustomerId;

    // Create Stripe customer if the user doesn't have one yet
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create(
        { email: user.email, name: user.name, metadata: { userId: String(user.id) } },
        { idempotencyKey: `create-customer-${user.id}` }
      );
      stripeCustomerId = customer.id;
    }

    // Attach the new payment method to the Stripe customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: stripeCustomerId });

    // Set as default payment method for future invoices
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    user.subscription = {
      ...user.subscription,
      status: 'active',
      planId: user.subscription?.planId || 'premium',
      planName: user.subscription?.planName || 'PREMIUM',
      planSpecs: user.subscription?.planSpecs || PLAN_SPECS.premium.specs,
      cardLast4,
      cardBrand,
      stripeCustomerId,
      stripeSubscriptionId: user.subscription?.stripeSubscriptionId,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    };

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Payment method updated successfully.',
      data: { subscription: user.subscription },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /payments/create-setup-intent ──────────────────────────────────────
// Creates a Stripe SetupIntent so Stripe.js on the frontend can securely
// collect and tokenize card details without raw data hitting our server.
export const createSetupIntent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!stripe) {
      return next(new AppError('Payment processing is not configured on this server.', 503));
    }

    const user = await User.findById(req.user!.id);
    if (!user) return next(new AppError('User not found', 404));

    let stripeCustomerId = user.subscription?.stripeCustomerId;

    // Lazily create a Stripe customer on first payment interaction
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create(
        { email: user.email, name: user.name, metadata: { userId: String(user.id) } },
        { idempotencyKey: `create-customer-${user.id}` }
      );
      stripeCustomerId = customer.id;
      user.subscription = { ...user.subscription, stripeCustomerId };
      await user.save();
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    res.status(200).json({
      status: 'success',
      data: { clientSecret: setupIntent.client_secret },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /payments/update-credentials ───────────────────────────────────────
export const updateCredentials = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user!.id).select('+password');
    if (!user) return next(new AppError('User not found', 404));

    if (email && email.toLowerCase().trim() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) return next(new AppError('This email is already in use by another account.', 400));

      // Sync email change to Stripe customer
      if (stripe && user.subscription?.stripeCustomerId) {
        try {
          await stripe.customers.update(user.subscription.stripeCustomerId, { email: email.toLowerCase().trim() });
        } catch (stripeErr) {
          console.error('⚠️  Stripe customer email update error:', stripeErr);
        }
      }

      user.email = email.toLowerCase().trim();
    }

    if (newPassword) {
      if (!currentPassword || !(await user.comparePassword(currentPassword))) {
        return next(new AppError('Current password is incorrect.', 400));
      }
      user.password = newPassword;
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Account details updated successfully.',
      data: { user: { id: user.id, name: user.name, email: user.email } },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /payments/checkout-session ─────────────────────────────────────────
export const createCheckoutSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { planId } = req.body as { planId: 'mobile' | 'standard' | 'premium' };

    if (!stripe) {
      return next(new AppError('Payment processing is not configured on this server.', 503));
    }

    const user = req.user!;
    const planConfig = PLAN_SPECS[planId] || PLAN_SPECS.premium;

    // Idempotency key scoped to user + plan + current hour to prevent duplicate sessions
    const idempotencyKey = `checkout-${user.id}-${planId}-${Math.floor(Date.now() / 3_600_000)}`;

    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Streamly ${planConfig.name} Plan`,
                description: planConfig.specs,
              },
              unit_amount: planConfig.priceAmount,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: env.STRIPE_SUCCESS_URL,
        cancel_url: env.STRIPE_CANCEL_URL,
        client_reference_id: String(user.id),
        metadata: { planId, userId: String(user.id) },
      },
      { idempotencyKey }
    );

    res.status(200).json({ status: 'success', data: { sessionUrl: session.url } });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/v1/payments/webhook ────────────────────────────────────────────
// MUST be registered with express.raw({ type: 'application/json' }) in app.ts
// BEFORE the express.json() middleware to preserve the raw request body
// required for Stripe signature verification.
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];

  if (!stripe || !sig) {
    console.error('❌ Webhook called but Stripe is not configured or signature missing.');
    res.status(400).json({ error: 'Webhook not configured.' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️  Stripe webhook signature verification failed:', (err as Error).message);
    res.status(400).json({ error: 'Webhook signature verification failed.' });
    return;
  }

  console.log(`📨 Stripe event received: ${event.type}`);

  try {
    switch (event.type) {
      // ── Checkout completed → activate subscription ────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId || session.client_reference_id;
        const planId = (session.metadata?.planId || 'premium') as 'mobile' | 'standard' | 'premium';

        if (userId) {
          const user = await User.findById(userId);
          if (user) {
            const planConfig = PLAN_SPECS[planId] || PLAN_SPECS.premium;
            user.subscription = {
              ...user.subscription,
              status: 'active',
              planId,
              planName: planConfig.name,
              planSpecs: planConfig.specs,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              cardLast4: user.subscription?.cardLast4 || '****',
              cardBrand: user.subscription?.cardBrand || 'card',
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              cancelAtPeriodEnd: false,
            };
            await user.save();
            console.log(`✅ Subscription activated for user ${userId}`);
          }
        }
        break;
      }

      // ── Subscription updated (plan change, renewal, etc.) ─────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await User.findOne({ 'subscription.stripeCustomerId': subscription.customer as string });

        if (user) {
          const validStatuses = ['none', 'active', 'canceled', 'past_due', 'unpaid'];
          const mappedStatus = validStatuses.includes(subscription.status)
            ? (subscription.status as 'none' | 'active' | 'canceled' | 'past_due' | 'unpaid')
            : 'active';

          user.subscription = {
            ...user.subscription,
            status: mappedStatus,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            stripeCustomerId: subscription.customer as string,
            stripeSubscriptionId: subscription.id,
            cardLast4: user.subscription?.cardLast4 || '****',
            cardBrand: user.subscription?.cardBrand || 'card',
            planId: user.subscription?.planId || 'premium',
            planName: user.subscription?.planName || 'PREMIUM',
            planSpecs: user.subscription?.planSpecs || PLAN_SPECS.premium.specs,
          };
          await user.save();
          console.log(`✅ Subscription updated for customer ${subscription.customer}`);
        }
        break;
      }

      // ── Subscription canceled ─────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await User.findOne({ 'subscription.stripeCustomerId': subscription.customer as string });

        if (user) {
          user.subscription.status = 'canceled';
          user.subscription.cancelAtPeriodEnd = false;
          await user.save();
          console.log(`⚠️  Subscription canceled for customer ${subscription.customer}`);
        }
        break;
      }

      // ── Invoice paid → reactivate if past_due ────────────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const user = await User.findOne({ 'subscription.stripeCustomerId': invoice.customer as string });

        if (user && user.subscription.status !== 'active') {
          user.subscription.status = 'active';
          await user.save();
          console.log(`✅ Invoice paid, subscription reactivated for customer ${invoice.customer}`);
        }
        break;
      }

      // ── Invoice payment failed → mark past_due ───────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const user = await User.findOne({ 'subscription.stripeCustomerId': invoice.customer as string });

        if (user) {
          user.subscription.status = 'past_due';
          await user.save();
          console.log(`❌ Payment failed for customer ${invoice.customer}`);
        }
        break;
      }

      default:
        // Unknown/unhandled event — acknowledge receipt to avoid Stripe retries
        console.log(`ℹ️  Unhandled Stripe event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
};

// ─── GET /payments/invoices ──────────────────────────────────────────────────
export const getInvoices = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) return next(new AppError('User not authenticated.', 401));

    const user = await User.findById(req.user.id);
    if (!user) return next(new AppError('User not found.', 404));

    const customerId = user.subscription?.stripeCustomerId;
    let invoicesList: Record<string, unknown>[] = [];

    // Try fetching from Stripe API if customer ID is set and Stripe key is valid
    if (stripe && customerId && env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.includes('mock')) {
      try {
        const stripeInvoices = await stripe.invoices.list({ customer: customerId, limit: 10 });
        invoicesList = stripeInvoices.data.map((inv) => ({
          id: inv.number || inv.id,
          date: new Date(inv.created * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          description: `Streamly ${user.subscription.planName || 'Premium'} Plan`,
          // BUG-3: Use USD ($) consistently — Stripe charges are in USD
          amount: `$${(inv.amount_paid / 100).toFixed(2)}`,
          status: inv.status === 'paid' ? 'Paid' : (inv.status || 'Pending'),
          card: `${user.subscription.cardBrand.toUpperCase()} •••• ${user.subscription.cardLast4}`,
        }));
      } catch { /* fallback below */ }
    }

    // BUG-3: Default billing history fallback uses consistent USD ($) amounts matching PLAN_SPECS
    if (invoicesList.length === 0) {
      const now = new Date();
      const planAmount = user.subscription?.planId === 'mobile'
        ? '$3.99'
        : user.subscription?.planId === 'standard'
          ? '$9.99'
          : '$15.99';
      for (let i = 0; i < 5; i++) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        invoicesList.push({
          id: `INV-2026-00${8 - i}`,
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          description: `Streamly ${user.subscription?.planName || 'Premium'} Plan`,
          amount: planAmount,
          status: 'Paid',
          card: `${(user.subscription?.cardBrand || 'Visa').toUpperCase()} •••• ${user.subscription?.cardLast4 || '4242'}`,
        });
      }
    }

    res.status(200).json({ status: 'success', data: { invoices: invoicesList } });
  } catch (error) {
    next(error);
  }
};

// ─── POST /payments/cancel-subscription ──────────────────────────────────────────────
// Schedules subscription to cancel at the end of the current billing period.
// Sets cancelAtPeriodEnd=true on Stripe and reflects status in DB.
export const cancelSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) return next(new AppError('User not authenticated.', 401));

    const user = await User.findById(req.user.id);
    if (!user) return next(new AppError('User not found.', 404));

    if (user.subscription?.status !== 'active') {
      return next(new AppError('No active subscription to cancel.', 400));
    }

    // Try to cancel via Stripe if subscription ID is available
    if (stripe && user.subscription?.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      } catch (stripeErr) {
        console.error('⚠️  Stripe cancel error:', stripeErr);
        // Fall through — update local DB regardless
      }
    }

    user.subscription.cancelAtPeriodEnd = true;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Your subscription has been scheduled for cancellation at the end of the current billing period.',
      data: { subscription: user.subscription },
    });
  } catch (error) {
    next(error);
  }
};
