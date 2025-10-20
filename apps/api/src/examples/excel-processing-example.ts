/**
 * Example usage of the new three-step Excel processing system
 * 
 * This example shows how to use the UnifiedExcelWorker with the new clean architecture
 */

import { 
  unifiedExcelWorker, 
  boss, 
  QUEUE_NAMES, 
  Logger,
  UnifiedExcelWorker
} from '../excel-processing';

// Example: How to start the worker
async function startExcelProcessing(): Promise<void> {
  try {
    await unifiedExcelWorker.start();
    Logger.info('Excel processing worker started successfully');
  } catch (error) {
    Logger.error('Failed to start Excel processing worker', error);
    throw error;
  }
}

// Example: How to send an Excel job for processing
async function processExcelFile(
  jobId: number, 
  filePath: string, 
  filename: string, 
  createdBy?: string
): Promise<string | null> {
  try {
    Logger.logJobStart(jobId, 'Excel Processing', filename);
    
    const jobId_result = await UnifiedExcelWorker.sendExcelJob(jobId, filePath, filename, createdBy);
    
    Logger.info(`Excel processing job ${jobId} queued successfully`, { jobId_result });
    return jobId_result;
  } catch (error) {
    Logger.logJobError(jobId, 'Excel Processing', error);
    throw error;
  }
}

// Example: How to check job status
async function checkJobStatus(jobId: number): Promise<{ jobId: number; status: string }> {
  try {
    Logger.info('Checking job status', { jobId });
    
    // Note: In a real implementation, you would check the database for job status
    // This is just an example of how you might structure the function
    return { jobId, status: 'processing' };
  } catch (error) {
    Logger.error('Failed to get job status', { jobId, error });
    throw error;
  }
}

// Example: How to stop the worker
async function stopExcelProcessing(): Promise<void> {
  try {
    await unifiedExcelWorker.stop();
    Logger.info('Excel processing worker stopped successfully');
  } catch (error) {
    Logger.error('Failed to stop Excel processing worker', error);
    throw error;
  }
}

// Example: How to get worker status
function getWorkerStatus() {
  const status = unifiedExcelWorker.getStatus();
  Logger.info('Worker status retrieved', status);
  return status;
}

export {
  startExcelProcessing,
  processExcelFile,
  checkJobStatus,
  stopExcelProcessing,
  getWorkerStatus,
};
