import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { env } from '../config/env.js';

describe('Notifications Endpoints & Lifecycle', () => {
  let token: string;
  let userEmail: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || env.MONGODB_URI;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    userEmail = `notif_test_${Date.now()}@example.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Notif Tester',
        email: userEmail,
        password: 'Password123!',
      });

    const user = await User.findOne({ email: userEmail });
    if (user) {
      user.isVerified = true;
      await user.save();
    }

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userEmail,
        password: 'Password123!',
      });

    token = loginRes.body.token;
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({ email: /notif_test_.*@example\.com/ });
    await Notification.deleteMany({});
    await mongoose.connection.close();
  });

  it('should fetch user notifications and unread counter', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.notifications).toBeDefined();
    expect(Array.isArray(res.body.data.notifications)).toBe(true);
    expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(0);
  }, 15000);

  it('should mark all notifications as read', async () => {
    const res = await request(app)
      .patch('/api/v1/notifications/mark-all-read')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    const checkRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(checkRes.body.data.unreadCount).toBe(0);
  }, 15000);
});
