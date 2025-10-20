/**
 * Upload Job Model
 * Data model for upload job records
 */

import { z } from 'zod';

// Upload job schema
export const UploadJobSchema = z.object({
  id: z.number().optional(),
  filename: z.string().max(255, 'Filename must be 255 characters or less'),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  totalRecords: z.number().optional(),
  processedRecords: z.number().default(0),
  failedRecords: z.number().default(0),
  errorDetails: z.any().optional(),
  createdBy: z.string().max(255).optional(),
  createdAt: z.date().optional(),
  completedAt: z.date().optional(),
});

// Upload job type
export type UploadJob = z.infer<typeof UploadJobSchema>;

// Upload job creation data
export const UploadJobCreateSchema = UploadJobSchema.omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type UploadJobCreate = z.infer<typeof UploadJobCreateSchema>;

// Upload job update data
export const UploadJobUpdateSchema = UploadJobSchema.partial().omit({
  id: true,
  createdAt: true,
});

export type UploadJobUpdate = z.infer<typeof UploadJobUpdateSchema>;

// Upload job status
export type UploadJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Upload job statistics
export interface UploadJobStats {
  totalJobs: number;
  pendingJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
}

// Upload job model class
export class UploadJobModel {
  /**
   * Validate upload job data
   */
  static validate(data: unknown): UploadJob {
    return UploadJobSchema.parse(data);
  }

  /**
   * Validate upload job creation data
   */
  static validateCreate(data: unknown): UploadJobCreate {
    return UploadJobCreateSchema.parse(data);
  }

  /**
   * Validate upload job update data
   */
  static validateUpdate(data: unknown): UploadJobUpdate {
    return UploadJobUpdateSchema.parse(data);
  }

  /**
   * Safe parse upload job data
   */
  static safeParse(data: unknown): { success: boolean; data?: UploadJob; error?: z.ZodError } {
    const result = UploadJobSchema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      error: result.success ? undefined : result.error,
    };
  }

  /**
   * Format upload job for database
   */
  static formatForDatabase(job: UploadJobCreate): any {
    return {
      ...job,
      createdAt: new Date(),
    };
  }

  /**
   * Format upload job for API response
   */
  static formatForResponse(job: any): UploadJob {
    return {
      id: job.id,
      filename: job.filename,
      status: job.status,
      totalRecords: job.totalRecords,
      processedRecords: job.processedRecords,
      failedRecords: job.failedRecords,
      errorDetails: job.errorDetails,
      createdBy: job.createdBy,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    };
  }

  /**
   * Calculate job progress percentage
   */
  static calculateProgress(job: UploadJob): number {
    if (!job.totalRecords || job.totalRecords === 0) {
      return 0;
    }
    return Math.round(((job.processedRecords || 0) / job.totalRecords) * 100);
  }

  /**
   * Check if job is completed
   */
  static isCompleted(job: UploadJob): boolean {
    return job.status === 'completed';
  }

  /**
   * Check if job is failed
   */
  static isFailed(job: UploadJob): boolean {
    return job.status === 'failed';
  }

  /**
   * Check if job is processing
   */
  static isProcessing(job: UploadJob): boolean {
    return job.status === 'processing';
  }

  /**
   * Check if job is pending
   */
  static isPending(job: UploadJob): boolean {
    return job.status === 'pending';
  }
}
