import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import { env } from './config/env.js';
import { errorHandler, AppError } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { stripeWebhook } from './controllers/paymentController.js';

export const createApp = (): express.Application => {
  const app = express();

  // Security HTTP Headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Development Logging
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // ── Stripe Webhook ───────────────────────────────────────────────────────
  // MUST be registered BEFORE express.json() — Stripe signature verification
  // requires the raw, unparsed request body.
  app.post(
    '/api/v1/payments/webhook',
    express.raw({ type: 'application/json' }),
    stripeWebhook
  );

  // Request Body Parsers (registered after webhook to preserve raw body)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Apply General Rate Limiter to API routes
  app.use('/api', apiLimiter);

  // Health Check Endpoint
  app.get('/health', (_req: Request, res: Response) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    res.status(200).json({
      status: 'ok',
      service: 'Streamly Backend API',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatusMap[dbState] || 'unknown',
        name: mongoose.connection.name || 'none',
      },
    });
  });

  // API v1 Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/profiles', profileRoutes);
  app.use('/api/v1/media', mediaRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // Handle Unhandled Routes (404)
  app.all('*', (req: Request, _res: Response, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });

  // Global Centralized Error Handler
  app.use(errorHandler);

  return app;
};

const app = createApp();
export default app;
