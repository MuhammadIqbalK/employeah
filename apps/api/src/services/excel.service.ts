/**
 * Excel Processing Service
 * Main service for handling Excel file processing operations
 */

import * as fs from 'fs';
import { ExcelUtils } from '../utils/excel.utils';
import { ExcelRepository } from '../repositories/excel.repository';
import { 
  ExcelRowData, 
  ProcessedRow, 
  ValidationError, 
  ParseValidateResult, 
  ProcessingResult,
  ExcelJobData 
} from '../types/excel.types';

export class ExcelService {
  private static readonly CHUNK_SIZE = 100;

  /**
   * Parse Excel file, validate data, and return chunks for processing
   * This function only does parsing and validation - no database operations
   */
  static async parseValidate(filePath: string, jobId: number): Promise<ParseValidateResult> {
    try {
      console.log('🔍 Parsing and validating Excel file:', {
        filePath,
        jobId,
        fileExists: fs.existsSync(filePath)
      });

      // Validate file exists
      ExcelUtils.validateFile(filePath);

      // Read Excel file
      const jsonData = ExcelUtils.readExcelFile(filePath);
      const headers = jsonData[0] as string[];
      
      // Validate headers
      ExcelUtils.validateHeaders(headers);

      // Process rows
      const { validRows, errorRecords } = this.processRows(jsonData, headers);

      // Create chunks from valid rows
      const validChunks = ExcelUtils.chunkArray(validRows, this.CHUNK_SIZE);

      console.log(`✅ Parsing completed: ${validChunks.length} chunks, ${errorRecords.length} errors`);

      return {
        validChunks,
        errorRecords,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new Error(`Failed to parse Excel file: ${message}`);
    }
  }

  /**
   * Process all rows in the Excel file
   */
  private static processRows(jsonData: any[][], headers: string[]): {
    validRows: ExcelRowData[];
    errorRecords: ValidationError[];
  } {
    const validRows: ExcelRowData[] = [];
    const errorRecords: ValidationError[] = [];

    // Process each data row (skip header row)
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      const rowData = ExcelUtils.mapRowData(headers, row);
      const processedRow = ExcelUtils.validateRowData(rowData, i + 1);

      if (processedRow.isValid) {
        const dbReadyData = ExcelUtils.convertToDbFormat(processedRow.data);
        validRows.push(dbReadyData);
      } else {
        const error = ExcelUtils.createValidationError(
          processedRow.rowNumber,
          processedRow.errors,
          processedRow.data
        );
        errorRecords.push(error);
      }
    }

    return { validRows, errorRecords };
  }

  /**
   * Insert data chunk to trx_employee table
   */
  static async insertDataChunk(jobId: number, chunkData: ExcelRowData[]): Promise<void> {
    try {
      console.log(`📝 Inserting chunk of ${chunkData.length} records for job ${jobId}`);

      await ExcelRepository.insertEmployeeBatch(chunkData);

      console.log(`✅ Successfully inserted ${chunkData.length} records for job ${jobId}`);
    } catch (error: unknown) {
      console.error(`❌ Failed to insert chunk for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Log error records to upload_errors table
   */
  static async logErrors(jobId: number, errorRecords: ValidationError[]): Promise<void> {
    try {
      console.log(`📝 Logging ${errorRecords.length} error records for job ${jobId}`);

      await ExcelRepository.insertErrorBatch(jobId, errorRecords);

      console.log(`✅ Successfully logged ${errorRecords.length} error records for job ${jobId}`);
    } catch (error: unknown) {
      console.error(`❌ Failed to log errors for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Legacy method - kept for backward compatibility
   * Process Excel file and save to database
   */
  static async processExcelFile(
    filePath: string, 
    jobId: number, 
    createdBy?: string
  ): Promise<ProcessingResult> {
    try {
      console.log('🔍 Processing Excel file (legacy method):', {
        filePath,
        jobId,
        fileExists: fs.existsSync(filePath),
        createdBy
      });

      // Update job status to processing
      await ExcelRepository.updateJobStatus(jobId, { status: 'processing' });

      // Parse and validate
      const { validChunks, errorRecords } = await this.parseValidate(filePath, jobId);
      
      // Calculate totals
      const totalRecords = validChunks.reduce((sum, chunk) => sum + chunk.length, 0) + errorRecords.length;
      const validRowsCount = validChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      
      // Update job with total records count
      await ExcelRepository.updateJobStatus(jobId, { totalRecords });
      
      const result: ProcessingResult = {
        totalRows: totalRecords,
        validRows: validRowsCount,
        invalidRows: errorRecords.length,
        errors: errorRecords,
      };

      // Log errors
      if (errorRecords.length > 0) {
        await this.logErrors(jobId, errorRecords);
      }

      // Insert valid chunks
      await this.processValidChunks(jobId, validChunks, result);

      // Update final job status
      await ExcelRepository.updateJobStatus(jobId, { 
        status: 'completed',
        completedAt: new Date(),
        failedRecords: result.invalidRows,
      });

      return result;
    } catch (error: unknown) {
      // Update job status to failed
      await ExcelRepository.updateJobStatus(jobId, { 
        status: 'failed',
        errorDetails: { error: error instanceof Error ? error.message : 'An unknown error occurred' },
        completedAt: new Date(),
      });

      throw error;
    }
  }

  /**
   * Process valid chunks and handle errors
   */
  private static async processValidChunks(
    jobId: number, 
    validChunks: ExcelRowData[][], 
    result: ProcessingResult
  ): Promise<void> {
    for (let i = 0; i < validChunks.length; i++) {
      const chunk = validChunks[i];
      try {
        await this.insertDataChunk(jobId, chunk);
        
        // Update processed records count
        const processedSoFar = validChunks.slice(0, i + 1).reduce((sum, c) => sum + c.length, 0);
        await ExcelRepository.updateJobStatus(jobId, { 
          processedRecords: processedSoFar,
          status: processedSoFar === result.validRows ? 'completed' : 'processing'
        });

      } catch (error: unknown) {
        console.error(`Batch insertion error:`, error);
        
        // Mark individual rows as failed
        const failedErrors = chunk.map((record, index) => 
          ExcelUtils.createInsertionError(
            i * this.CHUNK_SIZE + index + 1, // Approximate row number
            error instanceof Error ? error : new Error('An unknown error occurred'),
            record
          )
        );

        await this.logErrors(jobId, failedErrors);
        result.errors.push(...failedErrors);
        result.invalidRows += chunk.length;
        result.validRows -= chunk.length;
      }
    }
  }

  /**
   * Get upload job status
   */
  static async getUploadJobStatus(jobId: number) {
    return await ExcelRepository.getJobById(jobId);
  }

  /**
   * Get upload errors for a job
   */
  static async getUploadErrors(jobId: number) {
    return await ExcelRepository.getJobErrors(jobId);
  }
}
