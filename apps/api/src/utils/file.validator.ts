/**
 * File Validation Utility
 * Validates uploaded files for type, size, and format
 */

import { File } from 'hono/utils/file';
import { Logger } from './logger';

export class FileValidator {
  private readonly ALLOWED_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];

  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  /**
   * Validate Excel file
   */
  async validateExcelFile(file: File): Promise<void> {
    Logger.info('Validating Excel file', { 
      filename: file.name, 
      type: file.type, 
      size: file.size 
    });

    // Check if file exists
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only Excel files (.xlsx, .xls) are allowed');
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    // Validate file name
    if (!file.name || file.name.trim().length === 0) {
      throw new Error('File name is required');
    }

    Logger.info('Excel file validation passed', { filename: file.name });
  }

  /**
   * Get allowed file types
   */
  getAllowedTypes(): string[] {
    return [...this.ALLOWED_TYPES];
  }

  /**
   * Get maximum file size
   */
  getMaxFileSize(): number {
    return this.MAX_FILE_SIZE;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
