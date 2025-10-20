/**
 * Unified Excel Processing Worker
 * Handles the three-step Excel processing pipeline with clean separation of concerns
 */

import { boss, QUEUE_NAMES } from '../config/pgboss';
import { ExcelService } from '../services/excel.service';
import { 
  ExcelJobData, 
  DataInsertJobData, 
  ErrorLoggingJobData, 
  WorkerStatus 
} from '../types/excel.types';
import * as fs from 'fs';

export class UnifiedExcelWorker {
  private isRunning = false;
  private readonly WORKER_CONFIG = {
    PARSE_VALIDATE: { teamSize: 1, teamConcurrency: 1 },
    DATA_INSERT: { teamSize: 5, teamConcurrency: 5 },
    ERROR_LOGGING: { teamSize: 1, teamConcurrency: 1 },
  };

  /**
   * Start all worker processes
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Unified Excel worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting Unified Excel processing worker...');

    try {
      await this.initializeWorkers();
      console.log('Unified Excel worker started successfully');
    } catch (error) {
      console.error('Failed to start Unified Excel worker:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop all worker processes
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    console.log('Stopping Unified Excel worker...');
    
    try {
      await boss.stop({ graceful: true });
      console.log('Unified Excel worker stopped');
    } catch (error) {
      console.error('Error stopping Unified Excel worker:', error);
      throw error;
    }
  }

  /**
   * Initialize all worker processes
   */
  private async initializeWorkers(): Promise<void> {
    await Promise.all([
      this.startParseValidateWorker(),
      this.startDataInsertWorker(),
      this.startErrorLoggingWorker(),
    ]);
  }

  /**
   * Start Parse & Validate worker
   */
  private async startParseValidateWorker(): Promise<void> {
    await boss.work(
      QUEUE_NAMES.EXCEL_PARSE_VALIDATE,
      this.WORKER_CONFIG.PARSE_VALIDATE,
      this.handleParseValidate.bind(this)
    );
  }

  /**
   * Start Data Insert worker
   */
  private async startDataInsertWorker(): Promise<void> {
    await boss.work(
      QUEUE_NAMES.DATA_INSERT,
      this.WORKER_CONFIG.DATA_INSERT,
      this.handleDataInsert.bind(this)
    );
  }

  /**
   * Start Error Logging worker
   */
  private async startErrorLoggingWorker(): Promise<void> {
    await boss.work(
      QUEUE_NAMES.ERROR_LOGGING,
      this.WORKER_CONFIG.ERROR_LOGGING,
      this.handleErrorLogging.bind(this)
    );
  }

  /**
   * Handle Parse & Validate jobs
   * Entry point for Excel processing pipeline
   */
  private async handleParseValidate(job: any): Promise<any> {
    const jobData: ExcelJobData = job.data;
    
    console.log(`🔍 Processing Parse & Validate job ${jobData.jobId} for file: ${jobData.filename}`);

    try {
      const result = await this.processParseValidateJob(jobData);
      
      console.log(`✅ Parse & Validate completed for job ${jobData.jobId}:`, {
        validChunks: result.validChunks.length,
        errorRecords: result.errorRecords.length,
        totalRecords: result.validChunks.reduce((sum, chunk) => sum + chunk.length, 0) + result.errorRecords.length
      });

      await this.distributeProcessingTasks(jobData.jobId, result);
      this.cleanupFile(jobData.filePath);

      return result;
    } catch (error) {
      console.error(`❌ Parse & Validate job ${jobData.jobId} failed:`, error);
      this.cleanupFile(jobData.filePath);
      throw error;
    }
  }

  /**
   * Process Parse & Validate job
   */
  private async processParseValidateJob(jobData: ExcelJobData) {
    return await ExcelService.parseValidate(jobData.filePath, jobData.jobId);
  }

  /**
   * Distribute processing tasks to appropriate queues
   */
  private async distributeProcessingTasks(jobId: number, result: any): Promise<void> {
    // Send valid chunks to DATA_INSERT queue
    await this.sendDataInsertTasks(jobId, result.validChunks);
    
    // Send error records to ERROR_LOGGING queue
    if (result.errorRecords.length > 0) {
      await this.sendErrorLoggingTask(jobId, result.errorRecords);
    }
  }

  /**
   * Send data insert tasks to queue
   */
  private async sendDataInsertTasks(jobId: number, validChunks: any[]): Promise<void> {
    for (let i = 0; i < validChunks.length; i++) {
      const chunk = validChunks[i];
      const jobData: DataInsertJobData = {
        jobId,
        chunkIndex: i,
        chunkData: chunk,
        totalChunks: validChunks.length,
      };

      await boss.send(QUEUE_NAMES.DATA_INSERT, jobData);
    }
  }

  /**
   * Send error logging task to queue
   */
  private async sendErrorLoggingTask(jobId: number, errorRecords: any[]): Promise<void> {
    const jobData: ErrorLoggingJobData = {
      jobId,
      errorRecords,
    };

    await boss.send(QUEUE_NAMES.ERROR_LOGGING, jobData, {
      priority: 5, // Higher priority for error logging
    });
  }

  /**
   * Handle Data Insert jobs
   * Process individual chunks of valid data
   */
  private async handleDataInsert(job: any): Promise<any> {
    const jobData: DataInsertJobData = job.data;
    
    console.log(`📝 Processing Data Insert job ${jobData.jobId}, chunk ${jobData.chunkIndex + 1}/${jobData.totalChunks}`);

    try {
      await ExcelService.insertDataChunk(jobData.jobId, jobData.chunkData);
      
      console.log(`✅ Data Insert completed for job ${jobData.jobId}, chunk ${jobData.chunkIndex + 1}/${jobData.totalChunks}`);

      return {
        jobId: jobData.jobId,
        chunkIndex: jobData.chunkIndex,
        recordsInserted: jobData.chunkData.length,
      };
    } catch (error) {
      console.error(`❌ Data Insert job ${jobData.jobId}, chunk ${jobData.chunkIndex + 1} failed:`, error);
      
      await this.handleDataInsertError(jobData, error);
      throw error;
    }
  }

  /**
   * Handle data insert errors by converting to error records
   */
  private async handleDataInsertError(jobData: DataInsertJobData, error: unknown): Promise<void> {
    const errorRecords = jobData.chunkData.map((record: any, index: number) => ({
      rowNumber: jobData.chunkIndex * 100 + index + 1, // Approximate row number
      errorType: 'insertion',
      errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
      rawData: record,
    }));

    await this.sendErrorLoggingTask(jobData.jobId, errorRecords);
  }

  /**
   * Handle Error Logging jobs
   * Log error records to the database
   */
  private async handleErrorLogging(job: any): Promise<any> {
    const jobData: ErrorLoggingJobData = job.data;
    
    console.log(`📝 Processing Error Logging job ${jobData.jobId} for ${jobData.errorRecords.length} errors`);

    try {
      await ExcelService.logErrors(jobData.jobId, jobData.errorRecords);
      
      console.log(`✅ Error Logging completed for job ${jobData.jobId}: ${jobData.errorRecords.length} errors logged`);

      return {
        jobId: jobData.jobId,
        errorsLogged: jobData.errorRecords.length,
      };
    } catch (error) {
      console.error(`❌ Error Logging job ${jobData.jobId} failed:`, error);
      throw error;
    }
  }

  /**
   * Clean up uploaded file after processing
   */
  private cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🧹 Cleaned up file: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to cleanup file ${filePath}:`, error);
    }
  }

  /**
   * Get worker status
   */
  getStatus(): WorkerStatus {
    return {
      isRunning: this.isRunning,
      queues: [
        QUEUE_NAMES.EXCEL_PARSE_VALIDATE,
        QUEUE_NAMES.DATA_INSERT,
        QUEUE_NAMES.ERROR_LOGGING,
      ],
    };
  }

  /**
   * Send a new Excel processing job to the queue
   */
  static async sendExcelJob(jobId: number, filePath: string, filename: string, createdBy?: string): Promise<string | null> {
    const jobData: ExcelJobData = {
      jobId,
      filePath,
      filename,
      createdBy,
    };

    return await boss.send(QUEUE_NAMES.EXCEL_PARSE_VALIDATE, jobData);
  }
}

// Create and export worker instance
export const unifiedExcelWorker = new UnifiedExcelWorker();
