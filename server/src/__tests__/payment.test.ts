import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import { env } from '../config/env.js';

describe('Payments & Invoices Endpoints', () => {
  let userToken: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || env.MONGODB_URI;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    const payEmail = `pay_${Date.now()}@example.com`;
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Pay Tester',
        email: payEmail,
        password: 'Password123!',
      });

    const user = await User.findOne({ email: payEmail });
    if (user) {
      user.isVerified = true;
      await user.save();
    }

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: payEmail,
        password: 'Password123!',
      });

    userToken = loginRes.body.token;
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({ email: /pay_.*@example\.com/ });
    await mongoose.connection.close();
  });

  it('should fetch user subscription details', async () => {
    const res = await request(app)
      .get('/api/v1/payments/subscription')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.subscription).toBeDefined();
  }, 15000);

  it('should fetch customer invoices list', async () => {
    const res = await request(app)
      .get('/api/v1/payments/invoices')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.invoices).toBeDefined();
    expect(Array.isArray(res.body.data.invoices)).toBe(true);
  }, 15000);
});
