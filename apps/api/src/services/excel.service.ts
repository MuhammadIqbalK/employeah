import * as XLSX from 'xlsx';
import { z } from 'zod';
import { db } from '../db';
import { trxEmployee, uploadJobs, uploadErrors } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';

// Excel row validation schema
const ExcelRowSchema = z.object({
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

export interface ProcessedRow {
  rowNumber: number;
  data: any;
  isValid: boolean;
  errors: string[];
}

export interface ProcessingResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: Array<{
    rowNumber: number;
    errorType: string;
    errorMessage: string;
    rawData: any;
  }>;
}

export class ExcelService {
  /**
   * Parse Excel file and validate data structure
   */
  static async parseExcelFile(filePath: string): Promise<ProcessedRow[]> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        throw new Error('Excel file must contain at least a header row and one data row');
      }

      const headers = jsonData[0] as string[];
      const expectedHeaders = ['firstname', 'lastname', 'gender', 'country', 'age', 'date'];
      
      // Validate headers
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      const processedRows: ProcessedRow[] = [];
      
      // Process each data row
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        const rowData: any = {};
        
        // Map row data to object
        headers.forEach((header, index) => {
          rowData[header] = row[index];
        });

        // Validate row data
        const validationResult = ExcelRowSchema.safeParse({
          ...rowData,
          age: typeof rowData.age === 'string' ? parseInt(rowData.age) : rowData.age,
        });

        processedRows.push({
          rowNumber: i + 1,
          data: rowData,
          isValid: validationResult.success,
          errors: validationResult.success ? [] : validationResult.error.errors.map(e => e.message),
        });
      }

      return processedRows;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new Error(`Failed to parse Excel file: ${message}`);
    }
  }

  /**
   * Process Excel file and save to database
   */
  static async processExcelFile(
    filePath: string, 
    jobId: number, 
    createdBy?: string
  ): Promise<ProcessingResult> {
    try {
      console.log('🔍 Processing Excel file:', {
        filePath,
        jobId,
        fileExists: fs.existsSync(filePath),
        createdBy
      });

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Update job status to processing
      await db.update(uploadJobs)
        .set({ status: 'processing' })
        .where(eq(uploadJobs.id, jobId));

      // Parse Excel file
      const processedRows = await this.parseExcelFile(filePath);
      
      // Update job with total records count
      await db.update(uploadJobs)
        .set({ totalRecords: processedRows.length })
        .where(eq(uploadJobs.id, jobId));
      
      const result: ProcessingResult = {
        totalRows: processedRows.length,
        validRows: 0,
        invalidRows: 0,
        errors: [],
      };

      // Process valid rows in batches
      const validRows = processedRows.filter(row => row.isValid);
      const invalidRows = processedRows.filter(row => !row.isValid);

      result.validRows = validRows.length;
      result.invalidRows = invalidRows.length;

      // Save invalid rows errors
      for (const row of invalidRows) {
        const errorRecord = {
          jobId,
          rowNumber: row.rowNumber,
          errorType: 'validation',
          errorMessage: row.errors.join(', '),
          rawData: row.data,
        };

        await db.insert(uploadErrors).values(errorRecord);
        result.errors.push(errorRecord);
      }

      // Process valid rows in batches of 100
      const batchSize = 100;
      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);
        
        const recordsToInsert = batch.map(row => ({
          firstname: row.data.firstname,
          lastname: row.data.lastname,
          gender: row.data.gender,
          country: row.data.country,
          age: parseInt(row.data.age),
          date: new Date(row.data.date),
        }));

        try {
          await db.insert(trxEmployee).values(recordsToInsert as any);
          
          // Update processed records count
          await db.update(uploadJobs)
            .set({ 
              processedRecords: i + batch.length,
              status: i + batch.length === validRows.length ? 'completed' : 'processing'
            })
            .where(eq(uploadJobs.id, jobId));

        } catch (error: unknown) {
          // Handle batch insertion errors
          console.error(`Batch insertion error:`, error);
          
          // Mark individual rows as failed
          for (const row of batch) {
            const errorRecord = {
              jobId,
              rowNumber: row.rowNumber,
              errorType: 'insertion',
              errorMessage: error instanceof Error ? error.message : 'An unknown error occurred',
              rawData: row.data,
            };

            await db.insert(uploadErrors).values(errorRecord);
            result.errors.push(errorRecord);
            result.invalidRows++;
            result.validRows--;
          }
        }
      }

      // Update final job status
      await db.update(uploadJobs)
        .set({ 
          status: 'completed',
          completedAt: new Date(),
          failedRecords: result.invalidRows,
        })
        .where(eq(uploadJobs.id, jobId));

      return result;
    } catch (error: unknown) {
      // Update job status to failed
      await db.update(uploadJobs)
        .set({ 
          status: 'failed',
          errorDetails: { error: error instanceof Error ? error.message : 'An unknown error occurred' },
          completedAt: new Date(),
        })
        .where(eq(uploadJobs.id, jobId));

      throw error;
    }
  }

  /**
   * Get upload job status
   */
  static async getUploadJobStatus(jobId: number) {
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
  static async getUploadErrors(jobId: number) {
    const errors = await db.select()
      .from(uploadErrors)
      .where(eq(uploadErrors.jobId, jobId))
      .orderBy(uploadErrors.rowNumber);

    return errors;
  }
}
