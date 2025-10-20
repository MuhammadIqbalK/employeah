/**
 * Excel Processing Utilities
 * Helper functions for Excel file processing
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { ExcelRowSchema, ExcelRowData, ProcessedRow, ValidationError } from '../types/excel.types';

export class ExcelUtils {
  /**
   * Check if file exists and is accessible
   */
  static validateFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
  }

  /**
   * Read Excel file and convert to JSON format
   */
  static readExcelFile(filePath: string): any[][] {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error('Excel file must contain at least a header row and one data row');
    }

    return jsonData;
  }

  /**
   * Validate Excel headers against expected format
   */
  static validateHeaders(headers: string[]): void {
    const expectedHeaders = ['firstname', 'lastname', 'gender', 'country', 'age', 'date'];
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }
  }

  /**
   * Map raw row data to structured object
   */
  static mapRowData(headers: string[], row: any[]): ExcelRowData {
    const rowData: any = {};
    headers.forEach((header, index) => {
      rowData[header] = row[index];
    });
    return rowData;
  }

  /**
   * Validate single row data using Zod schema
   */
  static validateRowData(rowData: ExcelRowData, rowNumber: number): ProcessedRow {
    const validationResult = ExcelRowSchema.safeParse({
      ...rowData,
      age: typeof rowData.age === 'string' ? parseInt(rowData.age) : rowData.age,
    });

    return {
      rowNumber,
      data: rowData,
      isValid: validationResult.success,
      errors: validationResult.success ? [] : validationResult.error.errors.map(e => e.message),
    };
  }

  /**
   * Convert processed row to database-ready format
   */
  static convertToDbFormat(rowData: ExcelRowData): ExcelRowData {
    return {
      firstname: rowData.firstname,
      lastname: rowData.lastname,
      gender: rowData.gender,
      country: rowData.country,
      age: parseInt(rowData.age.toString()),
      date: new Date(rowData.date).toISOString().split('T')[0], // Format as YYYY-MM-DD
    };
  }

  /**
   * Create validation error record
   */
  static createValidationError(rowNumber: number, errors: string[], rawData: ExcelRowData): ValidationError {
    return {
      rowNumber,
      errorType: 'validation',
      errorMessage: errors.join(', '),
      rawData,
    };
  }

  /**
   * Create insertion error record
   */
  static createInsertionError(rowNumber: number, error: Error, rawData: ExcelRowData): ValidationError {
    return {
      rowNumber,
      errorType: 'insertion',
      errorMessage: error.message,
      rawData,
    };
  }

  /**
   * Split array into chunks of specified size
   */
  static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
