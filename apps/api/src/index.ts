import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { cors } from 'hono/cors';
import uploadController from './controllers/upload.controller';
import recordsController from './controllers/records.controller';
import dashboardController from './controllers/dashboard.controller';
import { excelWorker } from './workers/excel.worker';
import boss from './config/pgboss';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    worker: excelWorker.getStatus(),
  });
});

// Simple test endpoint
app.get('/test', (c) => {
  return c.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3000,
  });
});

// Redis test endpoint
app.get('/test-redis', async (c) => {
  try {
    const { redis, CACHE_KEYS, CACHE_TTL } = await import('./config/redis');
    
    // Test basic Redis operations
    const testKey = 'test:api';
    const testValue = { 
      message: 'Redis test from API', 
      timestamp: new Date().toISOString(),
      server: 'Employeah API'
    };
    
    // Set test data
    await redis.setex(testKey, 60, JSON.stringify(testValue));
    
    // Get test data
    const retrieved = await redis.get(testKey);
    const parsedValue = JSON.parse(retrieved || '{}');
    
    // Test dashboard cache
    const mockStats = {
      totalRecords: 1000,
      testTime: new Date().toISOString()
    };
    await redis.setex(CACHE_KEYS.DASHBOARD_STATS, CACHE_TTL.DASHBOARD_STATS, JSON.stringify(mockStats));
    
    // Get all keys
    const allKeys = await redis.keys('*');
    
    return c.json({
      success: true,
      redis: {
        connection: 'OK',
        testData: parsedValue,
        cachedStats: mockStats,
        allKeys: allKeys,
        keyCount: allKeys.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Redis test error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// API routes
app.route('/api/upload', uploadController);
app.route('/api/records', recordsController);
app.route('/api/dashboard', dashboardController);

// Root endpoint
app.get('/', (c) => {
  return c.json({ 
    message: 'Employeah API Server',
    version: '1.0.0',
    endpoints: {
      upload: '/api/upload',
      records: '/api/records',
      dashboard: '/api/dashboard',
      health: '/health',
    },
  });
});

// Start the server
const port = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('🚀 Starting Employeah API Server...');
    console.log(`📡 Port: ${port}`);
    console.log(`🔗 Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
    console.log(`🔴 Redis Host: ${process.env.REDIS_HOST || 'localhost'}`);
    
    // Initialize PgBoss
    console.log('📦 Initializing PgBoss...');
    await boss.start();
    console.log('✅ PgBoss started successfully');

    // Start Excel worker
    console.log('👷 Starting Excel worker...');
    await excelWorker.start();
    console.log('✅ Excel worker started successfully');

    // Start the server
    console.log(`🌐 Server is running on port ${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}`);
    console.log(`❤️  Health Check: http://localhost:${port}/health`);
    console.log(`🧪 Test Endpoint: http://localhost:${port}/test`);
    
    return {
      port,
      fetch: app.fetch,
    };
  } catch (error: unknown) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await excelWorker.stop();
  await boss.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await excelWorker.stop();
  await boss.stop();
  process.exit(0);
});

// Start the server
startServer().then((server) => {
  console.log(`🎉 Server started successfully on port ${server.port}`);
}).catch((error) => {
  console.error('💥 Server startup failed:', error);
  process.exit(1);
});

export default app;
