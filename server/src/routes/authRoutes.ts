import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  logout,
  refreshTokenHandler,
  getMe,
  verifyEmail,
  resendVerificationOtp,
  forgotPasswordOtp,
  verifyResetOtp,
  resetPassword,
  registerSchema,
  loginSchema,
  googleLoginSchema,
  otpRequestSchema,
  verifyOtpSchema,
  resetPasswordSchema,
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

// Registration Email Verification
router.post('/verify-email', authLimiter, validate(verifyOtpSchema), verifyEmail);
router.post('/resend-verification-otp', authLimiter, validate(otpRequestSchema), resendVerificationOtp);

// OTP & Password Recovery
router.post('/forgot-password-otp', authLimiter, validate(otpRequestSchema), forgotPasswordOtp);
router.post('/verify-reset-otp', authLimiter, validate(verifyOtpSchema), verifyResetOtp);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

export default router;
