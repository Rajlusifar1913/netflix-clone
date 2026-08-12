import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

// Google OAuth Client setup
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// ─── Cookie Options ───────────────────────────────────────────────────────────
const isProduction = env.NODE_ENV === 'production';

const accessCookieOptions = {
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ('none' as const) : ('lax' as const),
};

const refreshCookieOptions = {
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ('none' as const) : ('lax' as const),
  path: '/api/v1/auth/refresh', // restrict refresh cookie to refresh endpoint only
};

// ─── Validation Schemas ───────────────────────────────────────────────────────
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/\d/, 'Password must contain at least one number'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Google ID token or credential is required'),
  }),
});

// ─── Token Helpers ────────────────────────────────────────────────────────────

/** Signs and stores a refresh token, sets it as httpOnly cookie */
const issueRefreshToken = async (
  user: InstanceType<typeof User>,
  res: Response
): Promise<void> => {
  const refreshToken = jwt.sign(
    { id: user.id, tokenFamily: crypto.randomBytes(8).toString('hex') },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  // Store raw refresh token in DB (trimmed to last 5 tokens)
  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
};

/** Issues access token cookie + refresh token cookie, responds with user data */
const sendTokenResponse = async (
  user: InstanceType<typeof User>,
  statusCode: number,
  res: Response,
  message: string
): Promise<void> => {
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  res.cookie('token', token, accessCookieOptions);

  // Issue a refresh token alongside the access token
  await issueRefreshToken(user, res);

  res.status(statusCode).json({
    status: 'success',
    message,
    token,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider,
      },
    },
  });
};

// ─── POST /auth/register ──────────────────────────────────────────────────────
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return next(new AppError('An account with this email address already exists.', 400));
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      authProvider: 'local',
    });

    // Automatically create default profile for the user
    await Profile.create({
      user: newUser._id,
      name: newUser.name.split(' ')[0] || 'Primary',
      avatar: 'linear-gradient(135deg,#0072d2,#62d5ff)',
      face: newUser.name.charAt(0).toUpperCase() || 'P',
      isKids: false,
    });

    await sendTokenResponse(newUser, 201, res, 'Account created successfully.');
  } catch (error) {
    next(error);
  }
};

// ─── POST /auth/login ─────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password.', 401));
    }

    await sendTokenResponse(user, 200, res, 'Signed in successfully.');
  } catch (error) {
    next(error);
  }
};

// ─── POST /auth/google ────────────────────────────────────────────────────────
/**
 * Google OAuth Login Handler
 * Verifies Google ID Token provided by the frontend client, finds or creates user,
 * and issues JWT session token.
 */
export const googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { idToken } = req.body;

    let payload: {
      sub: string;
      email?: string;
      name?: string;
      picture?: string;
    } | null = null;

    // 1. Try verifying with google-auth-library if GOOGLE_CLIENT_ID is configured
    if (env.GOOGLE_CLIENT_ID && !env.GOOGLE_CLIENT_ID.startsWith('your_google_client_id')) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: env.GOOGLE_CLIENT_ID,
        });
        const googlePayload = ticket.getPayload();
        if (googlePayload) {
          payload = {
            sub: googlePayload.sub,
            email: googlePayload.email,
            name: googlePayload.name,
            picture: googlePayload.picture,
          };
        }
      } catch (err) {
        console.warn('⚠️ Google client library token verification failed, falling back to tokeninfo endpoint:', (err as Error).message);
      }
    }

    // 2. Fallback / direct verification via Google TokenInfo API endpoint
    if (!payload) {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      if (!response.ok) {
        return next(new AppError('Invalid or expired Google ID token.', 401));
      }
      const data = (await response.json()) as {
        sub: string;
        email?: string;
        name?: string;
        picture?: string;
      };
      if (!data.sub || !data.email) {
        return next(new AppError('Google token does not contain valid user information.', 400));
      }
      payload = {
        sub: data.sub,
        email: data.email,
        name: data.name,
        picture: data.picture,
      };
    }

    if (!payload.email) {
      return next(new AppError('Google account must have an associated email address.', 400));
    }

    const email = payload.email.toLowerCase().trim();
    const googleId = payload.sub;

    // 3. Find existing user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      // Link googleId if user was previously created via local auth
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
      }
      if (payload.picture && (!user.avatar || user.avatar.startsWith('linear-gradient'))) {
        user.avatar = payload.picture;
      }
      await user.save();
    } else {
      // 4. Create new user for Google OAuth registration
      user = await User.create({
        name: payload.name || email.split('@')[0] || 'User',
        email,
        googleId,
        authProvider: 'google',
        avatar: payload.picture || 'linear-gradient(135deg,#0072d2,#62d5ff)',
      });

      // Create default profile for the user
      await Profile.create({
        user: user._id,
        name: user.name.split(' ')[0] || 'Primary',
        avatar: user.avatar || 'linear-gradient(135deg,#0072d2,#62d5ff)',
        face: user.name.charAt(0).toUpperCase() || 'G',
        isKids: false,
      });
    }

    // 5. Send token response
    await sendTokenResponse(user, 200, res, 'Signed in with Google successfully.');
  } catch (error) {
    next(error);
  }
};

// ─── POST /auth/logout ────────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  // Remove refresh token from DB if present
  const incomingRefreshToken = req.cookies?.refreshToken as string | undefined;
  if (incomingRefreshToken) {
    try {
      const decoded = jwt.verify(incomingRefreshToken, env.JWT_REFRESH_SECRET) as { id: string };
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshTokens = (user.refreshTokens || []).filter(
          (t) => t !== incomingRefreshToken
        );
        await user.save({ validateBeforeSave: false });
      }
    } catch {
      // Token already invalid — still proceed to clear cookies
    }
  }

  // Clear both access and refresh token cookies
  res.cookie('token', '', { expires: new Date(0), httpOnly: true });
  res.cookie('refreshToken', '', {
    expires: new Date(0),
    httpOnly: true,
    path: '/api/v1/auth/refresh',
  });

  res.status(200).json({
    status: 'success',
    message: 'Signed out successfully.',
  });
};

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
/**
 * Silent token renewal via refresh token rotation.
 * Reads the `refreshToken` httpOnly cookie, validates it, issues new
 * access + refresh tokens, and invalidates the old refresh token (rotation).
 */
export const refreshTokenHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken as string | undefined;

    if (!incomingRefreshToken) {
      return next(new AppError('No refresh token provided.', 401));
    }

    // Verify signature
    let decoded: { id: string };
    try {
      decoded = jwt.verify(incomingRefreshToken, env.JWT_REFRESH_SECRET) as { id: string };
    } catch {
      return next(new AppError('Invalid or expired refresh token.', 401));
    }

    // Find user and verify the token exists in DB (rotation / reuse detection)
    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }

    const tokenIndex = (user.refreshTokens || []).indexOf(incomingRefreshToken);
    if (tokenIndex === -1) {
      // Possible token reuse attack — invalidate ALL refresh tokens for this user
      user.refreshTokens = [];
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Refresh token reuse detected. Please sign in again.', 401));
    }

    // Rotate: remove old refresh token from DB
    user.refreshTokens = (user.refreshTokens || []).filter(
      (t) => t !== incomingRefreshToken
    );

    // Issue new access token
    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
    );

    res.cookie('token', newAccessToken, accessCookieOptions);

    // Issue new refresh token (rotation)
    await issueRefreshToken(user, res);

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully.',
      token: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    const userProfiles = await Profile.find({ user: req.user.id });

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          avatar: req.user.avatar,
          authProvider: req.user.authProvider,
        },
        profiles: userProfiles,
      },
    });
  } catch (error) {
    next(error);
  }
};
