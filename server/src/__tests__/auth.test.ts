import 'dotenv/config';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/User.js';
import { env } from '../config/env.js';

describe('Auth Endpoints & OTP Flow', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || env.MONGODB_URI;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  }, 30000);

  afterAll(async () => {
    await User.deleteMany({ email: /test_.*@example\.com/ });
    await mongoose.connection.close();
  });

  const testUser = {
    name: 'Jest Tester',
    email: `test_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  let token: string;

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
    token = res.body.token;
  }, 15000);

  it('should login an existing user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  }, 15000);

  it('should fetch authenticated current user details (/me)', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testUser.email);
  }, 15000);

  it('should trigger forgot password OTP dispatch', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password-otp')
      .send({ email: testUser.email });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toContain('OTP code dispatched');
  }, 15000);

  it('should reject invalid OTP verification request', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-reset-otp')
      .send({ email: testUser.email, otp: '000000' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid or expired OTP');
  }, 15000);
});
