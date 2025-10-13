import PgBoss from 'pg-boss';
import * as dotenv from 'dotenv';

dotenv.config({
    path: './.env',
});

export const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL!,
  schema: 'pgboss',
  retryLimit: 3,
  retryDelay: 60, // seconds
  retryBackoff: true,
  deleteAfterDays: 7,
  archiveCompletedAfterSeconds: 86400, // 1 day
});

boss.on('error', error => console.error(error));

// Queue names
export const QUEUE_NAMES = {
  EXCEL_PROCESSING: 'excel-processing',
  EMAIL_NOTIFICATIONS: 'email-notifications',
  DATA_VALIDATION: 'data-validation',
  REPORT_GENERATION: 'report-generation',
} as const;

export default boss;
