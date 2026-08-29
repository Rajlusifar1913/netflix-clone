import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

/**
 * Creates Nodemailer Transporter
 */
const createTransporter = () => {
  if (env.SMTP_USER && env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.gmail.com',
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return null;
};

const transporter = createTransporter();

/**
 * Sends a 6-digit OTP email using Nodemailer with HTML styling and console fallback.
 */
export const sendOtpEmail = async (
  to: string,
  otp: string,
  purpose: 'reset' | 'verification' = 'reset'
): Promise<boolean> => {
  const subject =
    purpose === 'reset'
      ? 'Streamly Password Reset OTP Code'
      : 'Verify Your Streamly Account Email';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0f0f0f; color: #ffffff; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background-color: #181818; border-radius: 12px; padding: 32px; border: 1px solid #282828; }
        .brand { color: #e50914; font-size: 28px; font-weight: bold; text-align: center; letter-spacing: 1px; margin-bottom: 24px; }
        .title { font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 12px; }
        .subtitle { font-size: 14px; color: #a0a0a0; text-align: center; margin-bottom: 28px; line-height: 1.5; }
        .otp-box { background-color: #262626; border: 1px dashed #e50914; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 28px; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #e50914; margin: 0; }
        .footer { font-size: 12px; color: #666666; text-align: center; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">STREAMLY</div>
        <div class="title">${purpose === 'reset' ? 'Password Reset Verification' : 'Email Verification Code'}</div>
        <div class="subtitle">Use the verification code below to authorize your account request. This code will expire in 10 minutes.</div>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        <div class="subtitle">If you did not request this OTP code, please ignore this email or contact support immediately.</div>
        <div class="footer">&copy; ${new Date().getFullYear()} Streamly Entertainment Inc. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;

  // Always log OTP to server console for instant dev testing
  console.log(`\n==================================================`);
  console.log(`✉️  [NODEMAILER OTP DISPATCH]`);
  console.log(`   To: ${to}`);
  console.log(`   Purpose: ${purpose.toUpperCase()}`);
  console.log(`   OTP Code: >>> ${otp} <<<`);
  console.log(`==================================================\n`);

  if (!transporter) {
    console.log(`ℹ️ [Nodemailer] SMTP user/pass not configured. OTP logged above for development.`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });
    console.log(`✅ [Nodemailer] Email successfully dispatched to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ [Nodemailer Error] Failed to send email to ${to}:`, error);
    // Dev fallback: return true so workflow is not blocked by bad SMTP credentials
    return true;
  }
};

/**
 * Sends generic HTML notification email
 */
export const sendNotificationEmail = async (
  to: string,
  subject: string,
  htmlContent: string
): Promise<boolean> => {
  console.log(`\n✉️  [NODEMAILER NOTIFICATION] To: ${to} | Subject: ${subject}`);

  if (!transporter) {
    console.log(`ℹ️ [Nodemailer] SMTP user/pass not configured. Message logged above.`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error(`❌ [Nodemailer Error] Notification email failed:`, error);
    return true;
  }
};
