/**
 * Upload Controller
 * Clean controller for file upload operations
 */

import { Context } from 'hono';
import { UploadService } from '../services/upload.service';
import { Logger } from '../utils/logger';
import { ApiResponse } from '../types/api.types';

export class UploadController {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  /**
   * Upload Excel file
   */
  async uploadExcel(c: Context): Promise<Response> {
    try {
      const requestId = c.get('requestId');
      Logger.info('Excel upload request', { requestId });

      const formData = await c.req.formData();
      const file = formData.get('file') as File;
      const createdBy = formData.get('createdBy') as string || 'system';

      if (!file) {
        return c.json(ApiResponse.error('No file provided'), 400);
      }

      const result = await this.uploadService.processExcelUpload(file, createdBy);
      
      Logger.info('Excel upload successful', { requestId, jobId: result.jobId });
      
      return c.json(ApiResponse.success('File uploaded successfully', result));
    } catch (error: unknown) {
      Logger.error('Excel upload failed', error);
      return c.json(ApiResponse.error('Failed to upload file'), 500);
    }
  }

  /**
   * Get upload job status
   */
  async getJobStatus(c: Context): Promise<Response> {
    try {
      const jobId = parseInt(c.req.param('jobId'));
      
      if (isNaN(jobId)) {
        return c.json(ApiResponse.error('Invalid job ID'), 400);
      }

      const status = await this.uploadService.getJobStatus(jobId);
      
      return c.json(ApiResponse.success('Job status retrieved', status));
    } catch (error: unknown) {
      Logger.error('Get job status failed', error);
      return c.json(ApiResponse.error('Failed to get job status'), 500);
    }
  }

  /**
   * Get upload errors
   */
  async getJobErrors(c: Context): Promise<Response> {
    try {
      const jobId = parseInt(c.req.param('jobId'));
      
      if (isNaN(jobId)) {
        return c.json(ApiResponse.error('Invalid job ID'), 400);
      }

      const errors = await this.uploadService.getJobErrors(jobId);
      
      return c.json(ApiResponse.success('Job errors retrieved', { jobId, errors }));
    } catch (error: unknown) {
      Logger.error('Get job errors failed', error);
      return c.json(ApiResponse.error('Failed to get job errors'), 500);
    }
  }

  /**
   * Download Excel template
   */
  async downloadTemplate(c: Context): Promise<Response> {
    try {
      const templateBuffer = await this.uploadService.generateTemplate();
      
      c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      c.header('Content-Disposition', 'attachment; filename="employee_template.xlsx"');
      
      return c.body(templateBuffer);
    } catch (error: unknown) {
      Logger.error('Template download failed', error);
      return c.json(ApiResponse.error('Failed to generate template'), 500);
    }
  }
}

// Export singleton instance
export const uploadController = new UploadController();
