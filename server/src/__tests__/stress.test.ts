import 'dotenv/config';
import autocannon from 'autocannon';
import http from 'http';
import mongoose from 'mongoose';
import app from '../app.js';
import { env } from '../config/env.js';

async function runStressTest() {
  console.log('🚀 Launching API High-Load Concurrency Stress Test...');

  // Connect to MongoDB Atlas
  const mongoUri = process.env.MONGODB_URI || env.MONGODB_URI;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
    console.log('🍃 Stress Test DB Connected');
  }

  // Start HTTP server instance on port 4001
  const PORT = 4001;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      console.log(`📡 Temporary stress test server listening on http://localhost:${PORT}`);
      resolve();
    });
  });

  try {
    const result = await autocannon({
      url: `http://localhost:${PORT}/api/v1/media/browse`,
      connections: 20, // 20 concurrent connections
      pipelining: 2,
      duration: 5, // 5 seconds load test
    });

    console.log('\n📊 ── STRESS TEST RESULTS ──');
    console.log(`✅ Total Requests Completed: ${result.requests.total}`);
    console.log(`🚀 Average Requests / Sec (RPS): ${result.requests.average}`);
    console.log(`⏱️ Average Latency: ${result.latency.average} ms`);
    console.log(`🎯 p99 Latency: ${result.latency.p99} ms`);
    console.log(`❌ 2xx Responses: ${result['2xx']}`);
    console.log(`⚠️ Non-2xx Responses: ${result.non2xx}`);

    if (result.non2xx > 0) {
      console.warn(`⚠️ Warning: ${result.non2xx} non-2xx responses during stress load.`);
    } else {
      console.log('🎉 API Stress Test Passed with 100% success rate!');
    }
  } catch (err) {
    console.error('❌ Stress test error:', err);
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

if (process.env.NODE_ENV !== 'test') {
  runStressTest();
}

export { runStressTest };
