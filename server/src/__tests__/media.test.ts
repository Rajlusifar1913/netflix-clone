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

  it('should handle video stream range request or fallback', async () => {
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

    const res = await request(app)
      .get(`/api/v1/media/stream/${media._id}`)
      .set('Range', 'bytes=0-1024');

    expect([200, 206, 302, 404]).toContain(res.status);
  }, 15000);
});
