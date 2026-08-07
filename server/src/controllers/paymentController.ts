import { Response, NextFunction } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

// Initialize Stripe if valid key exists
const stripe = env.STRIPE_SECRET_KEY.startsWith('sk_live') || env.STRIPE_SECRET_KEY.startsWith('sk_test_')
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion })
  : null;

export const PLAN_SPECS: Record<string, { name: string; specs: string; price: string }> = {
  mobile: {
    name: 'MOBILE',
    specs: 'Good 480p SD (1 Screen at once)',
    price: '$3.99 / mo',
  },
  standard: {
    name: 'STANDARD',
    specs: 'Full HD 1080p (2 Screens at once)',
    price: '$9.99 / mo',
  },
  premium: {
    name: 'PREMIUM',
    specs: 'Ultra HD 4K + HDR (4 Screens at once)',
    price: '$15.99 / mo',
  },
};

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

function isValidLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isSecond = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits.charAt(i), 10);
    if (isSecond) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    isSecond = !isSecond;
  }
  return sum % 10 === 0;
}

function detectCardBrand(cardNumber: string): string {
  const clean = cardNumber.replace(/\D/g, '');
  if (/^4/.test(clean)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
  if (/^3[47]/.test(clean)) return 'amex';
  if (/^(6011|65|64[4-9])/.test(clean)) return 'discover';
  return 'visa';
}

function isValidExpiry(expiry: string): boolean {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return false;
  const [monthStr, yearStr] = expiry.split('/');
  const month = parseInt(monthStr, 10);
  const year = 2000 + parseInt(yearStr, 10);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
}

export const updatePaymentMethodSchema = z.object({
  body: z.object({
    cardNumber: z.string().min(13, 'Card number is too short').max(23, 'Card number is too long'),
    expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry date must be MM/YY format'),
    cvc: z.string().min(3).max(4),
    cardholderName: z.string().min(2, 'Cardholder name is required').optional(),
  }),
});

export const getSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

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

export const changePlan = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { planId } = req.body as { planId: 'mobile' | 'standard' | 'premium' };
    const user = await User.findById(req.user!.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const planConfig = PLAN_SPECS[planId];
    if (!planConfig) {
      return next(new AppError('Invalid plan selected.', 400));
    }

    user.subscription = {
      ...(user.subscription || {}),
      status: 'active',
      planId,
      planName: planConfig.name,
      planSpecs: planConfig.specs,
      cardLast4: user.subscription?.cardLast4 || '4242',
      cardBrand: user.subscription?.cardBrand || 'visa',
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

export const updatePaymentMethod = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cardNumber, expiryDate, cvc } = req.body;

    const cleanCard = String(cardNumber).replace(/\D/g, '');

    // 1. Validate Luhn algorithm
    if (!isValidLuhn(cleanCard)) {
      return next(new AppError('Invalid credit card number. Please check the card details and try again.', 400));
    }

    // 2. Validate Expiry Date
    if (!isValidExpiry(expiryDate)) {
      return next(new AppError('Card has expired or expiry date is invalid (MM/YY).', 400));
    }

    // 3. Validate CVC
    if (!/^\d{3,4}$/.test(cvc)) {
      return next(new AppError('Security code (CVC/CVV) must be 3 or 4 digits.', 400));
    }

    const user = await User.findById(req.user!.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const cardLast4 = cleanCard.slice(-4);
    const cardBrand = detectCardBrand(cleanCard);

    user.subscription = {
      ...(user.subscription || {}),
      status: 'active',
      planId: user.subscription?.planId || 'premium',
      planName: user.subscription?.planName || 'PREMIUM',
      planSpecs: user.subscription?.planSpecs || PLAN_SPECS.premium.specs,
      cardLast4,
      cardBrand,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    };

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Payment method verified and updated successfully.',
      data: { subscription: user.subscription },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCredentials = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user!.id).select('+password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return next(new AppError('This email is already in use by another account.', 400));
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
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCheckoutSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { planId } = req.body as { planId: 'mobile' | 'standard' | 'premium' };
    const user = req.user!;

    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Streamly ${PLAN_SPECS[planId]?.name || 'Membership'} Plan`,
                description: PLAN_SPECS[planId]?.specs,
              },
              unit_amount: planId === 'mobile' ? 399 : planId === 'standard' ? 999 : 1599,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: env.STRIPE_SUCCESS_URL,
        cancel_url: env.STRIPE_CANCEL_URL,
        client_reference_id: user.id,
      });

      res.status(200).json({ status: 'success', data: { sessionUrl: session.url } });
      return;
    }

    // Direct mock update fallback
    return changePlan(req, res, next);
  } catch (error) {
    next(error);
  }
};
