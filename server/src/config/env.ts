import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/netflix_clone'),
  JWT_SECRET: z.string().default('super_secret_jwt_access_key_change_in_production_32chars_min'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().default('super_secret_jwt_refresh_key_change_in_production_32chars'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  TMDB_API_KEY: z.string().optional().default(''),
  TMDB_ACCESS_TOKEN: z.string().optional().default(''),
  STRIPE_SECRET_KEY: z.string().default('sk_test_mock_key_change_in_production'),
  STRIPE_WEBHOOK_SECRET: z.string().default('whsec_mock_key_change_in_production'),
  STRIPE_SUCCESS_URL: z.string().default('http://localhost:5173/account?payment=success'),
  STRIPE_CANCEL_URL: z.string().default('http://localhost:5173/account?payment=cancelled'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment configuration:', result.error.format());
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
