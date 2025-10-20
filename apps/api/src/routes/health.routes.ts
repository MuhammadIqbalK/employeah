/**
 * Health Check Routes
 * System health and status endpoints
 */

import { Hono } from 'hono';
import { Logger } from '../utils/logger';
import { excelWorker } from '../workers/excel.worker';
import { unifiedExcelWorker } from '../workers/unified-excel.worker';

const healthRoutes = new Hono();

// Basic health check
healthRoutes.get('/', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Detailed system status
healthRoutes.get('/detailed', (c) => {
  const workerStatus = excelWorker.getStatus();
  const unifiedWorkerStatus = unifiedExcelWorker.getStatus();
  
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    workers: {
      excel: workerStatus,
      unified: unifiedWorkerStatus,
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  });
});

// Worker status
healthRoutes.get('/workers', (c) => {
  const workerStatus = excelWorker.getStatus();
  const unifiedWorkerStatus = unifiedExcelWorker.getStatus();
  
  return c.json({
    workers: {
      excel: workerStatus,
      unified: unifiedWorkerStatus,
    },
    timestamp: new Date().toISOString(),
  });
});

export { healthRoutes };
