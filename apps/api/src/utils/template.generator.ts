/**
 * Template Generator Utility
 * Generates Excel templates for data upload
 */

import * as XLSX from 'xlsx';
import { Logger } from './logger';

export class TemplateGenerator {
  /**
   * Generate employee data template
   */
  async generateEmployeeTemplate(): Promise<Buffer> {
    try {
      Logger.info('Generating employee template');

      const templateData = [
        ['firstname', 'lastname', 'gender', 'country', 'age', 'date'],
        ['John', 'Doe', 'Male', 'USA', '25', '2024-01-15'],
        ['Jane', 'Smith', 'Female', 'Canada', '30', '2024-01-16'],
        ['Mike', 'Johnson', 'Male', 'UK', '28', '2024-01-17'],
      ];

      // Create workbook and worksheet
      const ws = XLSX.utils.aoa_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employee Template');

      // Style the header row
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:F1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E6E6FA' } },
          alignment: { horizontal: 'center' },
        };
      }

      // Set column widths
      ws['!cols'] = [
        { wch: 12 }, // firstname
        { wch: 12 }, // lastname
        { wch: 8 },  // gender
        { wch: 15 }, // country
        { wch: 5 },  // age
        { wch: 12 }, // date
      ];

      // Generate buffer
      const buffer = XLSX.write(wb, { 
        type: 'buffer', 
        bookType: 'xlsx',
        compression: true,
      });

      Logger.info('Employee template generated successfully', { 
        rows: templateData.length,
        bufferSize: buffer.length 
      });

      return buffer;
    } catch (error: unknown) {
      Logger.error('Template generation failed', error);
      throw new Error('Failed to generate Excel template');
    }
  }

  /**
   * Generate template with custom headers
   */
  async generateCustomTemplate(headers: string[], sampleData?: string[][]): Promise<Buffer> {
    try {
      Logger.info('Generating custom template', { headers });

      const templateData = [headers];
      
      if (sampleData && sampleData.length > 0) {
        templateData.push(...sampleData);
      }

      const ws = XLSX.utils.aoa_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Custom Template');

      // Generate buffer
      const buffer = XLSX.write(wb, { 
        type: 'buffer', 
        bookType: 'xlsx',
        compression: true,
      });

      Logger.info('Custom template generated successfully', { 
        headers: headers.length,
        rows: templateData.length 
      });

      return buffer;
    } catch (error: unknown) {
      Logger.error('Custom template generation failed', error);
      throw new Error('Failed to generate custom Excel template');
    }
  }

  /**
   * Get template headers for employee data
   */
  getEmployeeTemplateHeaders(): string[] {
    return ['firstname', 'lastname', 'gender', 'country', 'age', 'date'];
  }

  /**
   * Get sample data for employee template
   */
  getEmployeeSampleData(): string[][] {
    return [
      ['John', 'Doe', 'Male', 'USA', '25', '2024-01-15'],
      ['Jane', 'Smith', 'Female', 'Canada', '30', '2024-01-16'],
      ['Mike', 'Johnson', 'Male', 'UK', '28', '2024-01-17'],
    ];
  }
}
