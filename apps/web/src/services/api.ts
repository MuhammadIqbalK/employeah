import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

export interface UploadResponse {
  success: boolean;
  jobId: number;
  message: string;
}

export interface UploadStatus {
  jobId: number;
  status: string;
  progress: number;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  createdAt: string;
  completedAt?: string;
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

    return response.data;
  },

  async getUploadStatus(jobId: number): Promise<UploadStatus> {
    const response = await api.get(`/api/upload/status/${jobId}`);
    return response.data;
  },

  async getUploadErrors(jobId: number): Promise<{ jobId: number; errors: UploadError[] }> {
    const response = await api.get(`/api/upload/errors/${jobId}`);
    return response.data;
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
    return response.data;
  },

  async getRecord(id: number): Promise<Record> {
    const response = await api.get(`/api/records/${id}`);
    return response.data;
  },

  async updateRecord(id: number, data: Partial<Record>): Promise<Record> {
    const response = await api.put(`/api/records/${id}`, data);
    return response.data;
  },

  async deleteRecord(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/api/records/${id}`);
    return response.data;
  },

  async bulkUpdate(recordIds: number[], updates: Partial<Record>): Promise<{
    message: string;
    updatedCount: number;
  }> {
    const response = await api.post('/api/records/bulk-update', {
      recordIds,
      updates,
    });
    return response.data;
  },
};

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  },

  async getChartData(type: string): Promise<ChartData> {
    const response = await api.get(`/api/dashboard/charts/${type}`);
    return response.data;
  },

  async getCountries(): Promise<string[]> {
    const response = await api.get('/api/dashboard/countries');
    return response.data;
  },
};

export default api;
