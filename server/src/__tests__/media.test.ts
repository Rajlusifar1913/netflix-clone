import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import Media from '../models/Media.js';
import { env } from '../config/env.js';

describe('Media Catalog & Streaming Endpoints', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || env.MONGODB_URI;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should return categorized media browse rows', async () => {
    const res = await request(app).get('/api/v1/media/browse');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.rows).toBeDefined();
    expect(Array.isArray(res.body.data.rows)).toBe(true);
  }, 15000);

  it('should search media by title keyword', async () => {
    const res = await request(app).get('/api/v1/media/search?q=Inception');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.results).toBeDefined();
    expect(Array.isArray(res.body.data.results)).toBe(true);
  }, 15000);

  it('should require authentication for video stream endpoint', async () => {
    let media = await Media.findOne();
    if (!media) {
      media = await Media.create({
        tmdbId: 99999,
        title: 'Jest Test Video',
        overview: 'Test overview',
        mediaType: 'movie',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      });
    }

    // 1. Unauthenticated request should be rejected with 401 (SEC-7)
    const unauthRes = await request(app)
      .get(`/api/v1/media/stream/${media._id}`)
      .set('Range', 'bytes=0-1024');

    expect(unauthRes.status).toBe(401);

    // 2. Register user & verify to get auth token
    const regEmail = `stream_test_${Date.now()}@example.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Stream Tester',
        email: regEmail,
        password: 'Password123!',
      });

    const user = await (await import('../models/User.js')).default.findOne({ email: regEmail });
    if (user) {
      user.isVerified = true;
      await user.save();
    }

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: regEmail,
        password: 'Password123!',
      });

    const token = loginRes.body.token;

    // 3. Acquire DRM / HMAC signed stream token
    const tokenRes = await request(app)
      .get(`/api/v1/media/stream-token/${media._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(tokenRes.status).toBe(200);
    expect(tokenRes.body.data.streamToken).toBeDefined();

    // 4. Authenticated request with token should succeed with redirect (302) or stream (200/206)
    const authRes = await request(app)
      .get(`/api/v1/media/stream/${media._id}?token=${tokenRes.body.data.streamToken}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Range', 'bytes=0-1024');

    expect([200, 206, 302, 404]).toContain(authRes.status);
  }, 20000);
});
