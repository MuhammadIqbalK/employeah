/**
 * API Routes Configuration
 * Main API endpoint routing
 */

import { Hono } from 'hono';
import { uploadRoutes } from './upload.routes';
import { recordsRoutes } from './records.routes';
import { dashboardRoutes } from './dashboard.routes';

const apiRoutes = new Hono();

// API version info
apiRoutes.get('/', (c) => {
  return c.json({
    version: '1.0.0',
    endpoints: {
      upload: '/api/upload',
      records: '/api/records',
      dashboard: '/api/dashboard',
    },
    timestamp: new Date().toISOString(),
  });
});

// Mount sub-routes
apiRoutes.route('/upload', uploadRoutes);
apiRoutes.route('/records', recordsRoutes);
apiRoutes.route('/dashboard', dashboardRoutes);

export { apiRoutes };
