/**
 * Upload Repository
 * Data access layer for upload operations
 */

import { File } from 'hono/utils/file';
import { db } from '../db';
import { uploadJobs } from '../db/schema';
import { boss, QUEUE_NAMES } from '../config/pgboss';
import { redis, CACHE_KEYS } from '../config/redis';
import { Logger } from '../utils/logger';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadJobData {
  filename: string;
  status: string;
  createdBy: string;
}

export interface QueueJobData {
  jobId: number;
  filePath: string;
  filename: string;
  createdBy: string;
}

export class UploadRepository {
  private readonly uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'apps', 'api', 'uploads');
    this.ensureUploadsDirectory();
  }

  /**
   * Ensure uploads directory exists
   */
  private ensureUploadsDirectory(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      Logger.info('Created uploads directory', { path: this.uploadsDir });
    }
  }

  /**
   * Save uploaded file to disk
   */
  async saveFile(file: File): Promise<string> {
    try {
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name}`;
      const filePath = path.join(this.uploadsDir, filename);

      Logger.info('Saving file to disk', {
        originalName: file.name,
        filename,
        filePath,
        fileSize: file.size,
      });

      const arrayBuffer = await file.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

      Logger.info('File saved successfully', { filePath });

      return filePath;
    } catch (error: unknown) {
      Logger.error('Failed to save file', error);
      throw new Error('Failed to save uploaded file');
    }
  }

  /**
   * Create upload job record
   */
  async createUploadJob(jobData: UploadJobData) {
    try {
      Logger.info('Creating upload job', jobData);

      const job = await db.insert(uploadJobs).values({
        filename: jobData.filename,
        status: jobData.status,
        totalRecords: 0, // Will be updated when processing starts
        createdBy: jobData.createdBy,
      }).returning();

      Logger.info('Upload job created', { jobId: job[0].id });

      return job[0];
    } catch (error: unknown) {
      Logger.error('Failed to create upload job', error);
      throw new Error('Failed to create upload job');
    }
  }

  /**
   * Queue file for processing
   */
  async queueFileProcessing(queueData: QueueJobData): Promise<void> {
    try {
      Logger.info('Queuing file for processing', {
        jobId: queueData.jobId,
        filename: queueData.filename,
      });

      await boss.send(QUEUE_NAMES.EXCEL_PROCESSING, {
        jobId: queueData.jobId,
        filePath: queueData.filePath,
        filename: queueData.filename,
        createdBy: queueData.createdBy,
      });

      Logger.info('File queued for processing', { jobId: queueData.jobId });
    } catch (error: unknown) {
      Logger.error('Failed to queue file processing', error);
      throw new Error('Failed to queue file for processing');
    }
  }

  /**
   * Clear dashboard cache
   */
  async clearDashboardCache(): Promise<void> {
    try {
      await redis.del(CACHE_KEYS.DASHBOARD_STATS);
      Logger.info('Dashboard cache cleared');
    } catch (error: unknown) {
      Logger.error('Failed to clear dashboard cache', error);
      // Don't throw error for cache clearing failure
    }
  }

  /**
   * Get upload job by ID
   */
  async getUploadJobById(jobId: number) {
    try {
      const job = await db.select()
        .from(uploadJobs)
        .where(eq(uploadJobs.id, jobId))
        .limit(1);

      if (job.length === 0) {
        throw new Error('Upload job not found');
      }

      return job[0];
    } catch (error: unknown) {
      Logger.error('Failed to get upload job', { jobId, error });
      throw error;
    }
  }

  /**
   * Update upload job status
   */
  async updateUploadJobStatus(jobId: number, updates: Partial<UploadJobData>): Promise<void> {
    try {
      await db.update(uploadJobs)
        .set(updates)
        .where(eq(uploadJobs.id, jobId));

      Logger.info('Upload job status updated', { jobId, updates });
    } catch (error: unknown) {
      Logger.error('Failed to update upload job status', { jobId, error });
      throw error;
    }
  }

  /**
   * Get uploads directory path
   */
  getUploadsDirectory(): string {
    return this.uploadsDir;
  }
}
