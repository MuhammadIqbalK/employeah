/**
 * Middleware Configuration
 * Centralized middleware setup
 */

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { cors } from 'hono/cors';
import { Logger } from '../utils/logger';

export function setupMiddleware(app: Hono): void {
  // Request logging
  app.use('*', logger());
  
  // Pretty JSON response
  app.use('*', prettyJSON());
  
  // CORS configuration
  app.use('*', cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }));

  // Request ID middleware
  app.use('*', async (c, next) => {
    const requestId = crypto.randomUUID();
    c.set('requestId', requestId);
    Logger.debug('Request started', { requestId, method: c.req.method, path: c.req.path });
    await next();
    Logger.debug('Request completed', { requestId, status: c.res.status });
  });

  // Error handling middleware
  app.onError((err, c) => {
    const requestId = c.get('requestId') || 'unknown';
    Logger.error('Request error', { requestId, error: err.message, stack: err.stack });
    
    return c.json({
      error: 'Internal server error',
      requestId,
      timestamp: new Date().toISOString(),
    }, 500);
  });
}
