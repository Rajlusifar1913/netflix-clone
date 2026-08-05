import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV === 'development',
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`🍃 MongoDB Connected: ${conn.connection.host} (${conn.connection.name})`);

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB connection lost. Reconnecting...');
    });
  } catch (error) {
    console.error(`❌ Failed to connect to MongoDB: ${error instanceof Error ? error.message : error}`);
    // In production, we log error and exit if DB is critical
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};
