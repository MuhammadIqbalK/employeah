import { boss, QUEUE_NAMES } from '../config/pgboss';
import { ExcelService } from '../services/excel.service';
import * as fs from 'fs';

/**
 * Excel Processing Worker
 * This worker processes Excel files in the background using PgBoss queue
 */
export class ExcelWorker {
  private isRunning = false;

  async start() {
    if (this.isRunning) {
      console.log('Excel worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting Excel processing worker...');

    try {
      // Start the worker - updated to match PgBoss v9 API
      await boss.work(
        QUEUE_NAMES.EXCEL_PROCESSING,
        {
          teamSize: 3,
          teamConcurrency: 1,
        },
        this.processExcelJob.bind(this)
      );

      console.log('Excel worker started successfully');
    } catch (error) {
      console.error('Failed to start Excel worker:', error);
      this.isRunning = false;
    }
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    console.log('Stopping Excel worker...');
    
    try {
      await boss.stop({ graceful: true });
      console.log('Excel worker stopped');
    } catch (error) {
      console.error('Error stopping Excel worker:', error);
    }
  }

  /**
   * Process individual Excel job
   */
  private async processExcelJob(job: any) {
    const { jobId, filePath, filename, createdBy } = job.data;
    
    console.log(`Processing Excel job ${jobId} for file: ${filename}`);

    try {
      // Process the Excel file
      const result = await ExcelService.processExcelFile(filePath, jobId, createdBy);
      
      console.log(`Excel job ${jobId} completed successfully:`, {
        totalRows: result.totalRows,
        validRows: result.validRows,
        invalidRows: result.invalidRows,
      });

      // Clean up the uploaded file
      this.cleanupFile(filePath);

      return result;
    } catch (error) {
      console.error(`Excel job ${jobId} failed:`, error);
      
      // Clean up the uploaded file even on error
      this.cleanupFile(filePath);
      
      throw error;
    }
  }

  /**
   * Clean up uploaded file after processing
   */
  private cleanupFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up file: ${filePath}`);
      }
    } catch (error) {
      console.error(`Failed to cleanup file ${filePath}:`, error);
    }
  }

  /**
   * Get worker status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      queueName: QUEUE_NAMES.EXCEL_PROCESSING,
    };
  }
}

// Create and export worker instance
export const excelWorker = new ExcelWorker();
