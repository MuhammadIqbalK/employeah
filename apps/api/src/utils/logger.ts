/**
 * Logger Utility
 * Centralized logging functionality for Excel processing
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export class Logger {
  private static formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    }
    
    return `${prefix} ${message}`;
  }

  static debug(message: string, data?: any): void {
    console.debug(this.formatMessage(LogLevel.DEBUG, message, data));
  }

  static info(message: string, data?: any): void {
    console.info(this.formatMessage(LogLevel.INFO, message, data));
  }

  static warn(message: string, data?: any): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, data));
  }

  static error(message: string, data?: any): void {
    console.error(this.formatMessage(LogLevel.ERROR, message, data));
  }

  static logJobStart(jobId: number, jobType: string, filename?: string): void {
    this.info(`Starting ${jobType} job ${jobId}`, { filename });
  }

  static logJobComplete(jobId: number, jobType: string, result?: any): void {
    this.info(`Completed ${jobType} job ${jobId}`, result);
  }

  static logJobError(jobId: number, jobType: string, error: unknown): void {
    this.error(`Failed ${jobType} job ${jobId}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  static logProcessingStats(jobId: number, stats: {
    totalRecords?: number;
    validRecords?: number;
    invalidRecords?: number;
    chunks?: number;
  }): void {
    this.info(`Processing stats for job ${jobId}`, stats);
  }
}
