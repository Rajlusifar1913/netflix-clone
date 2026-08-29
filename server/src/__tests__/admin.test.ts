import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import { env } from '../config/env.js';

describe('Admin Portal Endpoints', () => {
  let adminToken: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || env.MONGODB_URI;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    const adminEmail = 'admin@streamly.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'Super Admin',
        email: adminEmail,
        password: 'AdminPassword123',
        role: 'admin',
        subscription: { status: 'active', planId: 'premium' },
      });
    }

    const loginRes = await request(app)
      .post('/api/v1/admin/login')
      .send({ email: adminEmail, password: 'AdminPassword123' });

    adminToken = loginRes.body.token || '';
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should allow super admin login', async () => {
    expect(adminToken).toBeDefined();
    expect(adminToken.length).toBeGreaterThan(10);
  }, 15000);

  it('should fetch live admin portal analytics summary', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.analytics.totalUsers).toBeDefined();
    expect(res.body.data.analytics.monthlyRecurringRevenue).toBeDefined();
  }, 15000);

  it('should fetch managed admin user list', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
  }, 15000);

  it('should fetch admin catalog repository', async () => {
    const res = await request(app)
      .get('/api/v1/admin/catalog')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
  }, 15000);

  it('should fetch subscription plans list', async () => {
    const res = await request(app)
      .get('/api/v1/admin/plans')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
  }, 15000);
});
