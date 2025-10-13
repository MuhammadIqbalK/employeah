import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS
app.use('*', cors());

// Simple test endpoints
app.get('/', (c) => {
  return c.json({ 
    message: 'Simple Test API Server',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3000,
  });
});

app.get('/test', (c) => {
  return c.json({ 
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

const port = process.env.PORT || 3000;

console.log(`🚀 Starting Simple Test Server on port ${port}`);
console.log(`🧪 Test endpoints:`);
console.log(`   http://localhost:${port}/`);
console.log(`   http://localhost:${port}/test`);
console.log(`   http://localhost:${port}/health`);

export default {
  port,
  fetch: app.fetch,
};
