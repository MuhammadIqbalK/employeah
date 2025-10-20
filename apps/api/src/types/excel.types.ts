/**
 * Excel Processing Types and Interfaces
 * Centralized type definitions for Excel processing functionality
 */

import { z } from 'zod';

// Excel Row Validation Schema
export const ExcelRowSchema = z.object({
  firstname: z.string().max(10, 'First name must be 10 characters or less'),
  lastname: z.string().max(10, 'Last name must be 10 characters or less'),
  gender: z.string().max(6, 'Gender must be 6 characters or less'),
  country: z.string().max(20, 'Country must be 20 characters or less'),
  age: z.number().min(0).max(99, 'Age must be between 0 and 99'),
  date: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid date format'),
});

// Core Data Interfaces
export interface ExcelRowData {
  firstname: string;
  lastname: string;
  gender: string;
  country: string;
  age: number;
  date: string;
}

export interface ProcessedRow {
  rowNumber: number;
  data: ExcelRowData;
  isValid: boolean;
  errors: string[];
}

export interface ValidationError {
  rowNumber: number;
  errorType: string;
  errorMessage: string;
  rawData: ExcelRowData;
}

export interface ParseValidateResult {
  validChunks: ExcelRowData[][];
  errorRecords: ValidationError[];
}

export interface ProcessingResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ValidationError[];
}

// Job Processing Interfaces
export interface ExcelJobData {
  jobId: number;
  filePath: string;
  filename: string;
  createdBy?: string;
}

export interface DataInsertJobData {
  jobId: number;
  chunkIndex: number;
  chunkData: ExcelRowData[];
  totalChunks: number;
}

export interface ErrorLoggingJobData {
  jobId: number;
  errorRecords: ValidationError[];
}

// Worker Status Interface
export interface WorkerStatus {
  isRunning: boolean;
  queues: string[];
}
