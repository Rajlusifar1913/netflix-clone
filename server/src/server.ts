import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import mongoose from 'mongoose';

const startServer = async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Initialize Express Application
  const app = createApp();

  // 3. Start HTTP Server
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Streamly Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
    console.log(`🔗 Health Check: http://localhost:${env.PORT}/health`);
    console.log(`🔗 API Base URL: http://localhost:${env.PORT}/api/v1`);
  });

  // Graceful Shutdown Handler
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n⚠️ ${signal} received. Initiating graceful shutdown...`);

    server.close(async () => {
      console.log('🔒 HTTP Server closed.');
      try {
        await mongoose.connection.close();
        console.log('🍃 MongoDB connection closed.');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error during MongoDB disconnection:', err);
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds if hanging
    setTimeout(() => {
      console.error('💥 Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // Handle Unhandled Rejections & Uncaught Exceptions
  process.on('unhandledRejection', (reason: Error) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down...', reason);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (error: Error) => {
    console.error('💥 UNCAUGHT EXCEPTION! Shutting down...', error);
    process.exit(1);
  });
};

startServer();
