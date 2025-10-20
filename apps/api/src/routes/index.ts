/**
 * Routes Configuration
 * Centralized route setup
 */

import { Hono } from 'hono';
import { healthRoutes } from './health.routes';
import { apiRoutes } from './api.routes';

export function setupRoutes(app: Hono): void {
  // Health check routes
  app.route('/health', healthRoutes);
  
  // API routes
  app.route('/api', apiRoutes);
  
  // Root endpoint
  app.get('/', (c) => {
    return c.json({
      message: 'Employeah API Server',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        api: '/api',
        docs: '/docs',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // 404 handler
  app.notFound((c) => {
    return c.json({
      error: 'Not Found',
      message: 'The requested resource was not found',
      timestamp: new Date().toISOString(),
    }, 404);
  });
}
