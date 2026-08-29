import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Notification } from '../models/Notification.js';
import { AppError } from '../middlewares/errorHandler.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

/**
 * Seeds initial onboarding notifications for a newly verified user
 */
export async function seedWelcomeNotifications(userId: string | Types.ObjectId): Promise<void> {
  try {
    const existing = await Notification.countDocuments({ user: userId });
    if (existing > 0) return;

    await Notification.insertMany([
      {
        user: userId,
        title: 'Welcome to Streamly!',
        message: 'Your account is verified and ready. Start exploring thousands of trending movies and TV series.',
        type: 'success',
        link: '/browse',
        isRead: false,
      },
      {
        user: userId,
        title: 'Ultra HD 4K Streaming Active',
        message: 'Your Premium plan gives you crystal-clear 4K HDR playback and spatial audio on supported devices.',
        type: 'info',
        link: '/account',
        isRead: false,
      },
      {
        user: userId,
        title: 'Trending Release: Dune: Part Two',
        message: 'Now streaming worldwide in 4K HDR. Add it to your list and start watching now.',
        type: 'promotion',
        link: '/browse',
        isRead: false,
      },
      {
        user: userId,
        title: 'Security Notice',
        message: 'A new session was authenticated for your account. If this was not you, review your account security.',
        type: 'system',
        link: '/account',
        isRead: false,
      },
    ]);
  } catch (err) {
    console.error('⚠️  Failed to seed welcome notifications:', err);
  }
}

// ─── GET /notifications ───────────────────────────────────────────────────────
export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Auto-seed welcome notifications if user has none
    await seedWelcomeNotifications(userId);

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /notifications/:id/read ────────────────────────────────────────────
export const markNotificationRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const rawId = Array.isArray(id) ? id[0] : id;

    if (!rawId || !Types.ObjectId.isValid(rawId)) {
      return next(new AppError('Invalid notification ID format.', 400));
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: rawId, user: req.user!.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return next(new AppError('Notification not found.', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /notifications/mark-all-read ─────────────────────────────────────────
export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Notification.updateMany({ user: req.user!.id, isRead: false }, { isRead: true });

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
};
