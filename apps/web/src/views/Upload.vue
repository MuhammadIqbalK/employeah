<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white shadow rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Excel Upload</h1>
          <p class="mt-1 text-sm text-gray-500">
            Upload Excel files to bulk import employee records
          </p>
        </div>
        <button
          @click="downloadTemplate"
          class="btn btn-secondary"
          :disabled="isDownloading"
        >
          <span v-if="isDownloading">Downloading...</span>
          <span v-else>Download Template</span>
        </button>
      </div>
    </div>

    <!-- Upload Form -->
    <div class="bg-white shadow rounded-lg p-6">
      <div class="space-y-6">
        <!-- File Upload Area -->
        <div
          @drop="handleDrop"
          @dragover.prevent
          @dragenter.prevent
          class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors duration-200"
          :class="{ 'border-primary-500 bg-primary-50': isDragOver }"
        >
          <div v-if="!selectedFile" class="space-y-4">
            <div class="mx-auto w-12 h-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p class="text-lg font-medium text-gray-900">Drop your Excel file here</p>
              <p class="text-sm text-gray-500">or click to browse</p>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept=".xlsx,.xls"
              @change="handleFileSelect"
              class="hidden"
            />
            <button
              @click="$refs.fileInput.click()"
              class="btn btn-primary"
            >
              Choose File
            </button>
            <p class="text-xs text-gray-400">
              Supported formats: .xlsx, .xls (Max size: 50MB)
            </p>
          </div>

          <!-- Selected File -->
          <div v-else class="space-y-4">
            <div class="mx-auto w-12 h-12 text-success-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-lg font-medium text-gray-900">{{ selectedFile.name }}</p>
              <p class="text-sm text-gray-500">
                {{ formatFileSize(selectedFile.size) }}
              </p>
            </div>
            <div class="flex justify-center space-x-3">
              <button
                @click="removeFile"
                class="btn btn-secondary"
              >
                Remove
              </button>
              <button
                @click="uploadFile"
                class="btn btn-primary"
                :disabled="isUploading"
              >
                <span v-if="isUploading">Uploading...</span>
                <span v-else>Upload File</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Upload Progress -->
        <div v-if="uploadJob" class="space-y-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">Upload Progress</span>
              <span class="text-sm text-gray-500">{{ uploadStatus.progress }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-primary-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${uploadStatus.progress}%` }"
              ></div>
            </div>
            <div class="mt-2 text-sm text-gray-600">
              Status: <span class="font-medium" :class="getStatusColor(uploadStatus.status)">{{ uploadStatus.status }}</span>
            </div>
            <div v-if="uploadStatus.totalRecords" class="text-sm text-gray-600">
              Records: {{ uploadStatus.processedRecords }} / {{ uploadStatus.totalRecords }}
              <span v-if="uploadStatus.failedRecords" class="text-danger-600">
                ({{ uploadStatus.failedRecords }} failed)
              </span>
            </div>
            <div v-else-if="uploadStatus.status === 'processing'" class="text-sm text-gray-600">
              Processing file... Please wait
            </div>
          </div>

          <!-- Error Details -->
          <div v-if="uploadErrors.length > 0" class="bg-danger-50 border border-danger-200 rounded-lg p-4">
            <div class="flex items-center mb-2">
              <svg class="w-5 h-5 text-danger-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="text-sm font-medium text-danger-800">
                {{ uploadErrors.length }} errors found
              </h3>
            </div>
            <div class="max-h-40 overflow-y-auto">
              <div v-for="error in uploadErrors.slice(0, 10)" :key="error.id" class="text-sm text-danger-700 mb-1">
                Row {{ error.rowNumber }}: {{ error.errorMessage }}
              </div>
              <div v-if="uploadErrors.length > 10" class="text-sm text-danger-600">
                ... and {{ uploadErrors.length - 10 }} more errors
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="bg-white shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Excel Template Format</h3>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Column</th>
              <th>Required</th>
              <th>Format</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-medium">firstname</td>
              <td><span class="text-danger-600">Yes</span></td>
              <td>VARCHAR(10)</td>
              <td>Employee first name (max 10 characters)</td>
            </tr>
            <tr>
              <td class="font-medium">lastname</td>
              <td><span class="text-danger-600">Yes</span></td>
              <td>VARCHAR(10)</td>
              <td>Employee last name (max 10 characters)</td>
            </tr>
            <tr>
              <td class="font-medium">gender</td>
              <td><span class="text-danger-600">Yes</span></td>
              <td>CHAR(6)</td>
              <td>Gender (max 6 characters)</td>
            </tr>
            <tr>
              <td class="font-medium">country</td>
              <td><span class="text-danger-600">Yes</span></td>
              <td>VARCHAR(20)</td>
              <td>Country name (max 20 characters)</td>
            </tr>
            <tr>
              <td class="font-medium">age</td>
              <td><span class="text-danger-600">Yes</span></td>
              <td>INTEGER</td>
              <td>Age (0-99)</td>
            </tr>
            <tr>
              <td class="font-medium">date</td>
              <td><span class="text-danger-600">Yes</span></td>
              <td>DATE</td>
              <td>Date in YYYY-MM-DD format</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { uploadService, type UploadResponse, type UploadStatus, type UploadError } from '../services/api';

// Reactive state
const selectedFile = ref<File | null>(null);
const isDragOver = ref(false);
const isUploading = ref(false);
const isDownloading = ref(false);
const uploadJob = ref<UploadResponse | null>(null);
const uploadStatus = ref<UploadStatus>({
  jobId: 0,
  status: 'pending',
  progress: 0,
  totalRecords: 0,
  processedRecords: 0,
  failedRecords: 0,
  createdAt: new Date(),
});
const uploadErrors = ref<UploadError[]>([]);
const statusInterval = ref<number | null>(null);

// File handling
const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  isDragOver.value = false;
  
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFile(files[0]);
  }
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    handleFile(target.files[0]);
  }
};

const handleFile = (file: File) => {
  // Validate file type
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    alert('Please select a valid Excel file (.xlsx or .xls)');
    return;
  }

  // Validate file size (50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('File size must be less than 50MB');
    return;
  }

  selectedFile.value = file;
};

const removeFile = () => {
  selectedFile.value = null;
  uploadJob.value = null;
  uploadStatus.value = {
    jobId: 0,
    status: 'pending',
    progress: 0,
    totalRecords: 0,
    processedRecords: 0,
    failedRecords: 0,
    createdAt: new Date(),
  };
  uploadErrors.value = [];
  if (statusInterval.value) {
    clearInterval(statusInterval.value);
    statusInterval.value = null;
  }
};

const uploadFile = async () => {
  if (!selectedFile.value) return;

  try {
    isUploading.value = true;
    const response = await uploadService.uploadExcel(selectedFile.value, 'user');
    uploadJob.value = response;
    uploadStatus.value.jobId = response.jobId;
    
    // Start polling for status updates
    startStatusPolling();
  } catch (error) {
    console.error('Upload failed:', error);
    alert('Upload failed. Please try again.');
  } finally {
    isUploading.value = false;
  }
};

const startStatusPolling = () => {
  if (statusInterval.value) {
    clearInterval(statusInterval.value);
  }
  
  statusInterval.value = setInterval(async () => {
    if (!uploadJob.value) return;
    
    try {
      const status = await uploadService.getUploadStatus(uploadJob.value.jobId);
      
      // Calculate progress based on status
      let progress = 0;
      if (status.status === 'pending') {
        progress = 5; // Just started
      } else if (status.status === 'processing') {
        if (status.totalRecords && status.totalRecords > 0) {
          progress = Math.round((status.processedRecords / status.totalRecords) * 100);
        } else {
          progress = 50; // Processing but no total count yet
        }
      } else if (status.status === 'completed') {
        progress = 100;
      } else if (status.status === 'failed') {
        progress = 0;
      }
      
      // Update status with calculated progress
      uploadStatus.value = {
        ...status,
        progress: Math.min(100, Math.max(0, progress))
      };
      
      console.log('📊 Upload status update:', {
        status: status.status,
        progress,
        processedRecords: status.processedRecords,
        totalRecords: status.totalRecords,
        failedRecords: status.failedRecords
      });
      
      // If completed or failed, stop polling
      if (status.status === 'completed' || status.status === 'failed') {
        if (statusInterval.value) {
          clearInterval(statusInterval.value);
          statusInterval.value = null;
        }
        
        // Fetch errors if any
        if (status.failedRecords > 0) {
          try {
            const errorResponse = await uploadService.getUploadErrors(status.jobId);
            uploadErrors.value = errorResponse.errors;
          } catch (error) {
            console.error('Failed to fetch errors:', error);
          }
        }
      }
    } catch (error) {
      console.error('Status check failed:', error);
    }
  }, 2000); // Poll every 2 seconds
};

const downloadTemplate = async () => {
  try {
    isDownloading.value = true;
    const blob = await uploadService.downloadTemplate();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'employee_template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Template download failed:', error);
    alert('Failed to download template. Please try again.');
  } finally {
    isDownloading.value = false;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'text-warning-600';
    case 'processing':
      return 'text-primary-600';
    case 'completed':
      return 'text-success-600';
    case 'failed':
      return 'text-danger-600';
    default:
      return 'text-gray-600';
  }
};

// Cleanup on unmount
onUnmounted(() => {
  if (statusInterval.value) {
    clearInterval(statusInterval.value);
  }
});
</script>
