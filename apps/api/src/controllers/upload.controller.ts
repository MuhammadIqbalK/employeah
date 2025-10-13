import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ExcelService } from '../services/excel.service';
import { db } from '../db';
import { uploadJobs } from '../db/schema';
import { boss, QUEUE_NAMES } from '../config/pgboss';
import { redis, CACHE_KEYS, CACHE_TTL } from '../config/redis';
import * as fs from 'fs';
import * as path from 'path';
import { eq } from 'drizzle-orm';

const uploadController = new Hono();

// Enable CORS
uploadController.use('*', cors());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'apps', 'api', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
console.log('📁 Uploads directory:', uploadsDir);

/**
 * Upload Excel file endpoint
 */
uploadController.post('/excel', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const createdBy = formData.get('createdBy') as string || 'system';

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only Excel files (.xlsx, .xls) are allowed' }, 400);
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return c.json({ error: 'File size exceeds 50MB limit' }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const filePath = path.join(uploadsDir, filename);

    console.log('📤 Saving file:', {
      originalName: file.name,
      filename,
      filePath,
      fileSize: file.size,
      uploadsDir
    });

    // Save file to disk
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
    
    console.log('✅ File saved successfully:', filePath);

    // Create upload job record
    const job = await db.insert(uploadJobs).values({
      filename: file.name,
      status: 'pending',
      totalRecords: 0, // Will be updated when processing starts
      createdBy,
    }).returning();

    const jobId = job[0].id;

    // Queue the file for processing
    await boss.send(QUEUE_NAMES.EXCEL_PROCESSING, {
      jobId,
      filePath,
      filename: file.name,
      createdBy,
    });

    // Clear dashboard cache
    await redis.del(CACHE_KEYS.DASHBOARD_STATS);

    return c.json({
      success: true,
      jobId,
      message: 'File uploaded successfully and queued for processing',
    });

  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

/**
 * Get upload job status
 */
uploadController.get('/status/:jobId', async (c) => {
  try {
    const jobId = parseInt(c.req.param('jobId'));
    
    if (isNaN(jobId)) {
      return c.json({ error: 'Invalid job ID' }, 400);
    }

    const job = await ExcelService.getUploadJobStatus(jobId);
    
    // Calculate progress percentage
    let progress = 0;
    if (job.totalRecords && job.totalRecords > 0) {
      progress = Math.round((job.processedRecords || 0 / job.totalRecords) * 100);
    }

    return c.json({
      jobId: job.id,
      status: job.status,
      progress,
      totalRecords: job.totalRecords,
      processedRecords: job.processedRecords,
      failedRecords: job.failedRecords,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });

  } catch (error: unknown) {
    console.error('Status check error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return c.json({ error: message }, 500);
  }
});

/**
 * Get upload errors for a job
 */
uploadController.get('/errors/:jobId', async (c) => {
  try {
    const jobId = parseInt(c.req.param('jobId'));
    
    if (isNaN(jobId)) {
      return c.json({ error: 'Invalid job ID' }, 400);
    }

    const errors = await ExcelService.getUploadErrors(jobId);
    
    return c.json({
      jobId,
      errors,
    });

  } catch (error: unknown) {
    console.error('Error retrieval error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return c.json({ error: message }, 500);
  }
});

/**
 * Download Excel template
 */
uploadController.get('/template', async (c) => {
  try {
    const templateData = [
      ['firstname', 'lastname', 'gender', 'country', 'age', 'date'],
      ['John', 'Doe', 'Male', 'USA', '25', '2024-01-15'],
      ['Jane', 'Smith', 'Female', 'Canada', '30', '2024-01-16'],
    ];

    // Create workbook
    const XLSX = require('xlsx');
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for download
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', 'attachment; filename="employee_template.xlsx"');
    
    return c.body(buffer);

  } catch (error) {
    console.error('Template download error:', error);
    return c.json({ error: 'Failed to generate template' }, 500);
  }
});

export default uploadController;
