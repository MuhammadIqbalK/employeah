import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Updated interfaces to match new backend API response format
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  requestId?: string;
}

export interface UploadResponse {
  jobId: number;
  filename: string;
  message: string;
}

export interface UploadStatus {
  jobId: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalRecords?: number;
  processedRecords?: number;
  failedRecords?: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface UploadError {
  id: number;
  jobId: number;
  rowNumber: number;
  errorType: string;
  errorMessage: string;
  rawData: any;
  createdAt: string;
}

export interface Record {
  id: number;
  firstname: string;
  lastname: string;
  gender: string;
  country: string;
  age: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalRecords: number;
  genderDistribution: Array<{
    gender: string;
    count: number;
    percentage: number;
  }>;
  countryDistribution: Array<{
    country: string;
    count: number;
    percentage: number;
  }>;
  averageAge: number;
  recordsToday: number;
  ageDistribution: Array<{
    ageRange: string;
    count: number;
    percentage: number;
  }>;
}

export interface ChartData {
  type: string;
  data: Array<{
    label: string;
    value: number;
  }>;
}

export const uploadService = {
  async uploadExcel(file: File, createdBy?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (createdBy) {
      formData.append('createdBy', createdBy);
    }

    const response = await api.post('/api/upload/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Handle new API response format
    const apiResponse: ApiResponse<UploadResponse> = response.data;
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || apiResponse.message);
    }
    
    return apiResponse.data!;
  },

  async getUploadStatus(jobId: number): Promise<UploadStatus> {
    const response = await api.get(`/api/upload/status/${jobId}`);
    
    // Handle new API response format
    const apiResponse: ApiResponse<UploadStatus> = response.data;
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || apiResponse.message);
    }
    
    return apiResponse.data!;
  },

  async getUploadErrors(jobId: number): Promise<{ jobId: number; errors: UploadError[] }> {
    const response = await api.get(`/api/upload/errors/${jobId}`);
    
    // Handle new API response format
    const apiResponse: ApiResponse<{ jobId: number; errors: UploadError[] }> = response.data;
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || apiResponse.message);
    }
    
    return apiResponse.data!;
  },

  async downloadTemplate(): Promise<Blob> {
    const response = await api.get('/api/upload/template', {
      responseType: 'blob',
    });
    return response.data;
  },
};

export const recordsService = {
  async getRecords(params: {
    page?: number;
    limit?: number;
    search?: string;
    gender?: string;
    country?: string;
    ageMin?: string;
    ageMax?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const response = await api.get('/api/records', { params });
    
    // Handle new API response format
    const apiResponse: ApiResponse = response.data;
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || apiResponse.message);
    }
    
    return apiResponse.data;
  },

  async getRecord(id: number): Promise<Record> {
    const response = await api.get(`/api/records/${id}`);
    
    // Handle new API response format
    const apiResponse: ApiResponse<Record> = response.data;
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || apiResponse.message);
    }
    
    return apiResponse.data!;
  },

  async updateRecord(id: number, data: Partial<Record>): Promise<Record> {
    const response = await api.put(`/api/records/${id}`, data);
    
    // Handle new API response format
    const apiResponse: ApiResponse<Record> = response.data;
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || apiResponse.message);
    }
    
    return apiResponse.data!;
  },

  async deleteRecord(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/api/records/${id}`);
    
    // Handle new API response format
    const apiResponse: ApiResponse<{ message: string }> = response.data;
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || apiResponse.message);
    }
    
    return apiResponse.data!;
  },

  async bulkUpdate(recordIds: number[], updates: Partial<Record>): Promise<{
    message: string;
    updatedCount: number;
  }> {
    const response = await api.post('/api/records/bulk-update', {
      recordIds,
      updates,
    });
    
    // Handle new API response format
    const apiResponse: ApiResponse<{
      message: string;
      updatedCount: number;
    }> = response.data;
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || apiResponse.message);
    }
    
    return apiResponse.data!;
  },
};

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/api/dashboard/stats');
    
    // Handle new API response format
    const apiResponse: ApiResponse<DashboardStats> = response.data;
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || apiResponse.message);
    }
    
    return apiResponse.data!;
  },

  async getChartData(type: string): Promise<ChartData> {
    const response = await api.get(`/api/dashboard/charts/${type}`);
    
    // Handle new API response format
    const apiResponse: ApiResponse<ChartData> = response.data;
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || apiResponse.message);
    }
    
    return apiResponse.data!;
  },

  async getCountries(): Promise<string[]> {
    const response = await api.get('/api/dashboard/countries');
    
    // Handle new API response format
    const apiResponse: ApiResponse<string[]> = response.data;
    if (!apiResponse.success) {
      throw new Error(apiResponse.error || apiResponse.message);
    }
    
    return apiResponse.data!;
  },
};

export default api;
