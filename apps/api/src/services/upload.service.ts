/**
 * Upload Service
 * Business logic for file upload operations
 */

import { File } from 'hono/utils/file';
import { ExcelService } from './excel.service';
import { UploadRepository } from '../repositories/upload.repository';
import { FileValidator } from '../utils/file.validator';
import { TemplateGenerator } from '../utils/template.generator';
import { Logger } from '../utils/logger';
import { UploadResult, JobStatus } from '../types/api.types';

export class UploadService {
  private uploadRepository: UploadRepository;
  private fileValidator: FileValidator;
  private templateGenerator: TemplateGenerator;

  constructor() {
    this.uploadRepository = new UploadRepository();
    this.fileValidator = new FileValidator();
    this.templateGenerator = new TemplateGenerator();
  }

  /**
   * Process Excel file upload
   */
  async processExcelUpload(file: File, createdBy: string): Promise<UploadResult> {
    try {
      Logger.info('Processing Excel upload', { 
        filename: file.name, 
        size: file.size,
        createdBy 
      });

      // Validate file
      await this.fileValidator.validateExcelFile(file);

      // Save file to disk
      const filePath = await this.uploadRepository.saveFile(file);

      // Create upload job record
      const job = await this.uploadRepository.createUploadJob({
        filename: file.name,
        status: 'pending',
        createdBy,
      });

      // Queue file for processing
      await this.uploadRepository.queueFileProcessing({
        jobId: job.id,
        filePath,
        filename: file.name,
        createdBy,
      });

      // Clear dashboard cache
      await this.uploadRepository.clearDashboardCache();

      Logger.info('Excel upload processed successfully', { 
        jobId: job.id,
        filename: file.name 
      });

      return {
        jobId: job.id,
        filename: file.name,
        message: 'File uploaded successfully and queued for processing',
      };
    } catch (error: unknown) {
      Logger.error('Excel upload processing failed', error);
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: number): Promise<JobStatus> {
    try {
      const job = await ExcelService.getUploadJobStatus(jobId);
      
      // Calculate progress percentage
      let progress = 0;
      if (job.totalRecords && job.totalRecords > 0) {
        progress = Math.round(((job.processedRecords || 0) / job.totalRecords) * 100);
      }

      return {
        jobId: job.id,
        status: job.status as any,
        progress,
        totalRecords: job.totalRecords || 0,
        processedRecords: job.processedRecords || 0,
        failedRecords: job.failedRecords || 0,
        createdAt: job.createdAt,
        completedAt: job.completedAt || undefined,
      };
    } catch (error: unknown) {
      Logger.error('Get job status failed', { jobId, error });
      throw error;
    }
  }

  /**
   * Get job errors
   */
  async getJobErrors(jobId: number) {
    try {
      const errors = await ExcelService.getUploadErrors(jobId);
      
      Logger.info('Job errors retrieved', { jobId, errorCount: errors.length });
      
      return {
        jobId,
        errors,
      };
    } catch (error: unknown) {
      Logger.error('Get job errors failed', { jobId, error });
      throw error;
    }
  }

  /**
   * Generate Excel template
   */
  async generateTemplate(): Promise<Buffer> {
    try {
      Logger.info('Generating Excel template');
      
      const templateBuffer = await this.templateGenerator.generateEmployeeTemplate();
      
      Logger.info('Excel template generated successfully');
      
      return templateBuffer;
    } catch (error: unknown) {
      Logger.error('Template generation failed', error);
      throw error;
    }
  }
}
