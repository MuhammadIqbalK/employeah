/**
 * Upload Routes
 * HTTP routes for file upload operations
 */

import { Hono } from 'hono';
import { uploadController } from '../controllers/upload.controller';

const uploadRoutes = new Hono();

// Upload Excel file
uploadRoutes.post('/excel', uploadController.uploadExcel.bind(uploadController));

// Get upload job status
uploadRoutes.get('/status/:jobId', uploadController.getJobStatus.bind(uploadController));

// Get upload errors
uploadRoutes.get('/errors/:jobId', uploadController.getJobErrors.bind(uploadController));

// Download Excel template
uploadRoutes.get('/template', uploadController.downloadTemplate.bind(uploadController));

export { uploadRoutes };
