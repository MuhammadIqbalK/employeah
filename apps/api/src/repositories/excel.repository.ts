/**
 * Excel Data Repository
 * Handles all database operations for Excel processing
 */

import { db } from '../db';
import { trxEmployee, uploadJobs, uploadErrors } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ExcelRowData, ValidationError } from '../types/excel.types';

export class ExcelRepository {
  /**
   * Insert multiple employee records in batch
   */
  static async insertEmployeeBatch(records: ExcelRowData[]): Promise<void> {
    if (records.length === 0) return;

    const recordsToInsert = records.map(record => ({
      firstname: record.firstname,
      lastname: record.lastname,
      gender: record.gender,
      country: record.country,
      age: record.age,
      date: record.date,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(trxEmployee).values(recordsToInsert);
  }

  /**
   * Insert multiple error records in batch
   */
  static async insertErrorBatch(jobId: number, errors: ValidationError[]): Promise<void> {
    if (errors.length === 0) return;

    const errorsToInsert = errors.map(error => ({
      jobId,
      rowNumber: error.rowNumber,
      errorType: error.errorType,
      errorMessage: error.errorMessage,
      rawData: error.rawData,
      createdAt: new Date(),
    }));

    await db.insert(uploadErrors).values(errorsToInsert);
  }

  /**
   * Update upload job status
   */
  static async updateJobStatus(
    jobId: number, 
    updates: {
      status?: string;
      totalRecords?: number;
      processedRecords?: number;
      failedRecords?: number;
      errorDetails?: any;
      completedAt?: Date;
    }
  ): Promise<void> {
    await db.update(uploadJobs)
      .set(updates)
      .where(eq(uploadJobs.id, jobId));
  }

  /**
   * Get upload job by ID
   */
  static async getJobById(jobId: number) {
    const job = await db.select()
      .from(uploadJobs)
      .where(eq(uploadJobs.id, jobId))
      .limit(1);

    if (job.length === 0) {
      throw new Error('Upload job not found');
    }

    return job[0];
  }

  /**
   * Get upload errors for a job
   */
  static async getJobErrors(jobId: number) {
    return await db.select()
      .from(uploadErrors)
      .where(eq(uploadErrors.jobId, jobId))
      .orderBy(uploadErrors.rowNumber);
  }
}
