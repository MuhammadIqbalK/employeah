/**
 * Application Configuration
 * Clean Hono app setup with middleware and routes
 */

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { cors } from 'hono/cors';
import { setupMiddleware } from './middleware';
import { setupRoutes } from './routes';

export function createApp(): Hono {
  const app = new Hono();

  // Setup middleware
  setupMiddleware(app);

  // Setup routes
  setupRoutes(app);

  return app;
}
