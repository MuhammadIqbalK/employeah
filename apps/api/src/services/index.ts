/**
 * Services Initialization
 * Initialize all services (database, queue, workers)
 */

import boss from '../config/pgboss';
import { excelWorker } from '../workers/excel.worker';
import { unifiedExcelWorker } from '../workers/unified-excel.worker';
import { Logger } from '../utils/logger';

export async function initializeServices(): Promise<void> {
  try {
    Logger.info('Initializing services...');

    // Initialize PgBoss
    Logger.info('Starting PgBoss...');
    await boss.start();
    Logger.info('PgBoss started successfully');

    // Start Excel workers
    Logger.info('Starting Excel workers...');
    await Promise.all([
      excelWorker.start(),
      unifiedExcelWorker.start(),
    ]);
    Logger.info('Excel workers started successfully');

    Logger.info('All services initialized successfully');
  } catch (error: unknown) {
    Logger.error('Service initialization failed', error);
    throw error;
  }
}
