import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { AppError } from './errorHandler.js';

export const adminOnly = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AppError('Authentication required to access admin resources.', 401));
  }

  if (req.user.role !== 'admin') {
    return next(new AppError('Access denied. Administrator privileges required.', 403));
  }

  next();
};
