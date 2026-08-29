import crypto from 'crypto';
import { env } from '../config/env.js';

export interface StreamTokenPayload {
  mediaId: string | number;
  userId: string;
  expiresAt: number; // Unix timestamp in seconds
}

/**
 * Generates an HMAC-SHA256 signature for media playback token
 */
export function generateStreamSignature(mediaId: string | number, userId: string, expiresAt: number): string {
  const secret = env.JWT_SECRET;
  const payload = `${mediaId}:${userId}:${expiresAt}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Creates a signed media stream token valid for a specified duration (default: 2 hours)
 */
export function createSignedStreamToken(
  mediaId: string | number,
  userId: string,
  durationSeconds = 7200
): { token: string; expiresAt: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + durationSeconds;
  const signature = generateStreamSignature(mediaId, userId, expiresAt);
  const token = Buffer.from(JSON.stringify({ mediaId, userId, expiresAt, sig: signature })).toString('base64url');

  return { token, expiresAt };
}

/**
 * Validates a signed stream token.
 * Returns payload if valid and unexpired; otherwise throws or returns null.
 */
export function verifyStreamToken(tokenStr: string, expectedMediaId?: string | number): StreamTokenPayload | null {
  try {
    const raw = Buffer.from(tokenStr, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as { mediaId: string | number; userId: string; expiresAt: number; sig: string };

    if (!parsed.mediaId || !parsed.userId || !parsed.expiresAt || !parsed.sig) {
      return null;
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (parsed.expiresAt < now) {
      return null;
    }

    // Check mediaId match if specified
    if (expectedMediaId !== undefined && String(parsed.mediaId) !== String(expectedMediaId)) {
      return null;
    }

    // Check HMAC signature integrity
    const expectedSig = generateStreamSignature(parsed.mediaId, parsed.userId, parsed.expiresAt);
    const isValid = crypto.timingSafeEqual(Buffer.from(parsed.sig, 'hex'), Buffer.from(expectedSig, 'hex'));

    if (!isValid) return null;

    return {
      mediaId: parsed.mediaId,
      userId: parsed.userId,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}
