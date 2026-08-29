import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Media } from '../models/Media.js';
import { Plan } from '../models/Plan.js';
import { Profile } from '../models/Profile.js';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

// ─── Admin Login ─────────────────────────────────────────────────────────────
export const adminLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const adminEmail = (email || '').toLowerCase().trim();

    // Check user in database
    const user = await User.findOne({ email: adminEmail }).select('+password');

    if (!user || user.role !== 'admin') {
      return next(new AppError('Invalid administrator credentials or access denied.', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid administrator credentials.', 401));
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'admin' },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'admin',
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin Analytics ─────────────────────────────────────────────────────────
export const getAdminAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find();
    const mediaItems = await Media.find();
    const plans = await Plan.find();

    const activeUsers = users.filter((u) => u.subscription?.status === 'active');
    const totalMRR = activeUsers.reduce((sum, u) => {
      const plan = plans.find((p) => p.planId === u.subscription?.planId);
      return sum + (plan ? plan.monthlyAmount : 649);
    }, 0);

    const totalViews = mediaItems.reduce((sum, m) => sum + (m.viewsCount || 0), 0);

    // Device distribution simulation based on user profiles count
    const profilesCount = await Profile.countDocuments();

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalUsers: users.length,
          activeSubscribers: activeUsers.length,
          canceledSubscribers: users.filter((u) => u.subscription?.status === 'canceled').length,
          totalMRR,
          annualRunRate: totalMRR * 12,
          totalViews,
          totalMediaItems: mediaItems.length,
          totalProfiles: profilesCount,
        },
        deviceBreakdown: [
          { device: 'Desktop (Chrome / PC)', percentage: 54, count: Math.round(users.length * 0.54), color: '#e50914' },
          { device: 'Mobile (iOS & Android)', percentage: 32, count: Math.round(users.length * 0.32), color: '#3b82f6' },
          { device: 'Smart TV & Cast', percentage: 14, count: Math.round(users.length * 0.14), color: '#10b981' },
        ],
        topVideos: mediaItems
          .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
          .slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Users Management ─────────────────────────────────────────────────────────
export const getAllUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role, planId } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return next(new AppError('User with this email already exists.', 400));
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: password || 'Password123',
      role: role || 'user',
      subscription: {
        status: 'active',
        planId: planId || 'premium',
        planName: (planId || 'premium').toUpperCase(),
        planSpecs: 'Ultra HD 4K + HDR (4 Screens at once)',
        cardLast4: '4242',
        cardBrand: 'visa',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
      },
    });

    res.status(201).json({ status: 'success', data: newUser });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!user) return next(new AppError('User not found', 404));
    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return next(new AppError('User not found', 404));
    await Profile.deleteMany({ user: id });
    res.status(200).json({ status: 'success', message: 'User and profiles deleted.' });
  } catch (error) {
    next(error);
  }
};

export const updateUserSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { planId, status, extendDays } = req.body;

    const user = await User.findById(id);
    if (!user) return next(new AppError('User not found', 404));

    if (planId) user.subscription.planId = planId;
    if (status) user.subscription.status = status;
    if (extendDays) {
      const currentEnd = user.subscription.currentPeriodEnd
        ? new Date(user.subscription.currentPeriodEnd).getTime()
        : Date.now();
      user.subscription.currentPeriodEnd = new Date(Math.max(Date.now(), currentEnd) + extendDays * 86400000);
    }

    await user.save();
    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    next(error);
  }
};

// ─── Video Catalog Management ────────────────────────────────────────────────
export const getCatalog = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const media = await Media.find().sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', count: media.length, data: media });
  } catch (error) {
    next(error);
  }
};

export const createCatalogMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const maxTmdb = await Media.findOne().sort({ tmdbId: -1 });
    const nextTmdbId = (maxTmdb?.tmdbId || 100) + 1;

    const newMedia = await Media.create({
      ...req.body,
      tmdbId: req.body.tmdbId || nextTmdbId,
    });

    res.status(201).json({ status: 'success', data: newMedia });
  } catch (error) {
    next(error);
  }
};

export const updateCatalogMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const media = await Media.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!media) return next(new AppError('Media item not found', 404));
    res.status(200).json({ status: 'success', data: media });
  } catch (error) {
    next(error);
  }
};

export const deleteCatalogMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const media = await Media.findByIdAndDelete(id);
    if (!media) return next(new AppError('Media item not found', 404));
    res.status(200).json({ status: 'success', message: 'Media item deleted.' });
  } catch (error) {
    next(error);
  }
};

// ─── Subscription Plans Management ───────────────────────────────────────────
export const getAllPlans = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const plans = await Plan.find().sort({ monthlyAmount: 1 });
    res.status(200).json({ status: 'success', count: plans.length, data: plans });
  } catch (error) {
    next(error);
  }
};

export const createPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const slugId = (req.body.name || 'plan')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_') + `_${Date.now().toString(36).slice(-4)}`;

    const newPlan = await Plan.create({
      ...req.body,
      planId: req.body.planId || slugId,
    });

    res.status(201).json({ status: 'success', data: newPlan });
  } catch (error) {
    next(error);
  }
};

export const updatePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const plan = await Plan.findOneAndUpdate({ $or: [{ _id: id }, { planId: id }] }, req.body, { new: true });
    if (!plan) return next(new AppError('Plan not found', 404));
    res.status(200).json({ status: 'success', data: plan });
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const plan = await Plan.findOneAndDelete({ $or: [{ _id: id }, { planId: id }] });
    if (!plan) return next(new AppError('Plan not found', 404));
    res.status(200).json({ status: 'success', message: 'Plan deleted.' });
  } catch (error) {
    next(error);
  }
};
