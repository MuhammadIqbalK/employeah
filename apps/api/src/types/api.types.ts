/**
 * API Types and Interfaces
 * Common types used across the API
 */

export interface ApiResponseData<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  requestId?: string;
}

export class ApiResponse {
  static success<T>(message: string, data?: T): ApiResponseData<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message: string, error?: string): ApiResponseData {
    return {
      success: false,
      message,
      error,
      timestamp: new Date().toISOString(),
    };
  }
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  search?: string;
  filters?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface JobStatus {
  jobId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalRecords?: number;
  processedRecords?: number;
  failedRecords?: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface UploadResult {
  jobId: number;
  filename: string;
  message: string;
}
