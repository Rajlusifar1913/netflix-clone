import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Profile } from '../models/Profile.js';
import { AppError } from '../middlewares/errorHandler.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export const createProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Profile name is required').max(30),
    avatar: z.string().optional(),
    face: z.string().optional(),
    isKids: z.boolean().optional(),
    pin: z.string().max(4).optional(),
  }),
});

export const updateProfileSchema = z.object({
  params: z.object({
    profileId: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).max(30).optional(),
    avatar: z.string().optional(),
    face: z.string().optional(),
    isKids: z.boolean().optional(),
    pin: z.string().max(4).optional(),
  }),
});

export const myListSchema = z.object({
  body: z.object({
    mediaId: z.number(),
    mediaType: z.enum(['movie', 'tv']).default('movie'),
    title: z.string(),
    posterPath: z.string().nullable().optional(),
    backdropPath: z.string().nullable().optional(),
    voteAverage: z.number().optional(),
  }),
});

export const watchHistorySchema = z.object({
  body: z.object({
    mediaId: z.number(),
    mediaType: z.enum(['movie', 'tv']).default('movie'),
    title: z.string(),
    posterPath: z.string().nullable().optional(),
    backdropPath: z.string().nullable().optional(),
    progress: z.number().default(0),
    duration: z.number().default(0),
  }),
});

export const getProfiles = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profiles = await Profile.find({ user: req.user!.id }).sort({ createdAt: 1 });
    res.status(200).json({ status: 'success', data: { profiles } });
  } catch (error) {
    next(error);
  }
};

export const createProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const count = await Profile.countDocuments({ user: req.user!.id });
    if (count >= 5) {
      return next(new AppError('Maximum limit of 5 profiles per user reached.', 400));
    }

    const { name, avatar, face, isKids, pin } = req.body;
    const profile = await Profile.create({
      user: req.user!.id,
      name,
      avatar: avatar || 'linear-gradient(135deg,#0072d2,#62d5ff)',
      face: face || name.charAt(0).toUpperCase(),
      isKids: isKids ?? false,
      pin,
    });

    res.status(201).json({ status: 'success', data: { profile } });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { profileId } = req.params;
    const profile = await Profile.findOne({ _id: profileId, user: req.user!.id });

    if (!profile) {
      return next(new AppError('Profile not found', 404));
    }

    const { name, avatar, face, isKids, pin } = req.body;
    if (name !== undefined) profile.name = name;
    if (avatar !== undefined) profile.avatar = avatar;
    if (face !== undefined) profile.face = face;
    if (isKids !== undefined) profile.isKids = isKids;
    if (pin !== undefined) profile.pin = pin;

    await profile.save();
    res.status(200).json({ status: 'success', data: { profile } });
  } catch (error) {
    next(error);
  }
};

export const deleteProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { profileId } = req.params;
    const count = await Profile.countDocuments({ user: req.user!.id });

    if (count <= 1) {
      return next(new AppError('You must keep at least one profile.', 400));
    }

    const profile = await Profile.findOneAndDelete({ _id: profileId, user: req.user!.id });
    if (!profile) {
      return next(new AppError('Profile not found', 404));
    }

    res.status(200).json({ status: 'success', message: 'Profile deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// My List Toggle (Add / Remove)
export const toggleMyList = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { profileId } = req.params;
    const { mediaId, mediaType, title, posterPath, backdropPath, voteAverage } = req.body;

    const profile = await Profile.findOne({ _id: profileId, user: req.user!.id });
    if (!profile) {
      return next(new AppError('Profile not found', 404));
    }

    const existingIndex = profile.myList.findIndex((item) => item.mediaId === mediaId);

    let isAdded = false;
    if (existingIndex > -1) {
      // Remove from list
      profile.myList.splice(existingIndex, 1);
    } else {
      // Add to list
      profile.myList.unshift({
        mediaId,
        mediaType: mediaType || 'movie',
        title,
        posterPath: posterPath || null,
        backdropPath: backdropPath || null,
        voteAverage: voteAverage || 0,
        addedAt: new Date(),
      });
      isAdded = true;
    }

    await profile.save();
    res.status(200).json({
      status: 'success',
      message: isAdded ? 'Added to My List' : 'Removed from My List',
      data: { isAdded, myList: profile.myList },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyList = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { profileId } = req.params;
    const profile = await Profile.findOne({ _id: profileId, user: req.user!.id });
    if (!profile) {
      return next(new AppError('Profile not found', 404));
    }

    res.status(200).json({ status: 'success', data: { myList: profile.myList } });
  } catch (error) {
    next(error);
  }
};

// Watch History (Update & Get)
export const updateWatchProgress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { profileId } = req.params;
    const { mediaId, mediaType, title, posterPath, backdropPath, progress, duration } = req.body;

    const profile = await Profile.findOne({ _id: profileId, user: req.user!.id });
    if (!profile) {
      return next(new AppError('Profile not found', 404));
    }

    const existingIndex = profile.watchHistory.findIndex((item) => item.mediaId === mediaId);

    const historyData = {
      mediaId,
      mediaType: mediaType || 'movie',
      title,
      posterPath: posterPath || null,
      backdropPath: backdropPath || null,
      progress,
      duration,
      watchedAt: new Date(),
    };

    if (existingIndex > -1) {
      profile.watchHistory[existingIndex] = historyData;
    } else {
      profile.watchHistory.unshift(historyData);
    }

    await profile.save();
    res.status(200).json({ status: 'success', data: { watchHistory: profile.watchHistory } });
  } catch (error) {
    next(error);
  }
};
