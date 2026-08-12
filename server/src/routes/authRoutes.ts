import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  logout,
  refreshTokenHandler,
  getMe,
  registerSchema,
  loginSchema,
  googleLoginSchema,
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/google', authLimiter, validate(googleLoginSchema), googleLogin);
router.post('/logout', logout);
router.post('/refresh', refreshTokenHandler);
router.get('/me', protect, getMe);

export default router;
