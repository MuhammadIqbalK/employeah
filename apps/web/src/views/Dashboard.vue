<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white shadow rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p class="mt-1 text-sm text-gray-500">
            Overview of employee records and statistics
          </p>
        </div>
        <div class="text-sm text-gray-500">
          Last updated: {{ lastUpdated }}
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Total Records</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.totalRecords.toLocaleString() }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-success-500 rounded-md flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Records Today</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.recordsToday.toLocaleString() }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-warning-500 rounded-md flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Average Age</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.averageAge }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-danger-500 rounded-md flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Countries</p>
            <p class="text-2xl font-semibold text-gray-900">{{ stats.countryDistribution.length }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Gender Distribution -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Gender Distribution</h3>
        <div class="h-64">
          <canvas ref="genderChart"></canvas>
        </div>
      </div>

      <!-- Country Distribution -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Top Countries</h3>
        <div class="h-64">
          <canvas ref="countryChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Age Distribution and Timeline -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Age Distribution -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Age Distribution</h3>
        <div class="h-64">
          <canvas ref="ageChart"></canvas>
        </div>
      </div>

      <!-- Records Timeline -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Records Added (Last 30 Days)</h3>
        <div class="h-64">
          <canvas ref="timelineChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Gender Distribution Table -->
    <div class="bg-white shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Gender Distribution Details</h3>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Gender</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in stats.genderDistribution" :key="item.gender">
              <td class="font-medium">{{ item.gender }}</td>
              <td>{{ item.count.toLocaleString() }}</td>
              <td>{{ item.percentage }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Top Countries Table -->
    <div class="bg-white shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Top Countries</h3>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Country</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in stats.countryDistribution" :key="item.country">
              <td class="font-medium">{{ item.country }}</td>
              <td>{{ item.count.toLocaleString() }}</td>
              <td>{{ item.percentage }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Chart, registerables } from 'chart.js';
import { dashboardService, type DashboardStats } from '../services/api';

// Register Chart.js components
Chart.register(...registerables);

// Reactive state
const stats = ref<DashboardStats>({
  totalRecords: 0,
  genderDistribution: [],
  countryDistribution: [],
  averageAge: 0,
  recordsToday: 0,
  ageDistribution: [],
});

const lastUpdated = ref('');
const isLoading = ref(true);

// Chart refs
const genderChart = ref<HTMLCanvasElement | null>(null);
const countryChart = ref<HTMLCanvasElement | null>(null);
const ageChart = ref<HTMLCanvasElement | null>(null);
const timelineChart = ref<HTMLCanvasElement | null>(null);

// Chart instances
let genderChartInstance: Chart | null = null;
let countryChartInstance: Chart | null = null;
let ageChartInstance: Chart | null = null;
let timelineChartInstance: Chart | null = null;

// Load dashboard data
const loadDashboardData = async () => {
  try {
    isLoading.value = true;
    const data = await dashboardService.getStats();
    stats.value = data;
    lastUpdated.value = new Date().toLocaleString();
    
    // Load chart data
    await loadChartData();
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  } finally {
    isLoading.value = false;
  }
};

// Load chart data
const loadChartData = async () => {
  try {
    // Load gender chart
    const genderData = await dashboardService.getChartData('gender');
    createGenderChart(genderData);

    // Load country chart
    const countryData = await dashboardService.getChartData('country');
    createCountryChart(countryData);

    // Load age chart
    const ageData = await dashboardService.getChartData('age');
    createAgeChart(ageData);

    // Load timeline chart
    const timelineData = await dashboardService.getChartData('timeline');
    createTimelineChart(timelineData);
  } catch (error) {
    console.error('Failed to load chart data:', error);
  }
};

// Create charts
const createGenderChart = (data: any) => {
  if (!genderChart.value) return;
  
  if (genderChartInstance) {
    genderChartInstance.destroy();
  }

  genderChartInstance = new Chart(genderChart.value, {
    type: 'pie',
    data: {
      labels: data.data.map((item: any) => item.label),
      datasets: [{
        data: data.data.map((item: any) => item.value),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
        ],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
    },
  });
};

const createCountryChart = (data: any) => {
  if (!countryChart.value) return;
  
  if (countryChartInstance) {
    countryChartInstance.destroy();
  }

  countryChartInstance = new Chart(countryChart.value, {
    type: 'bar',
    data: {
      labels: data.data.map((item: any) => item.label),
      datasets: [{
        label: 'Records',
        data: data.data.map((item: any) => item.value),
        backgroundColor: '#3B82F6',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
};

const createAgeChart = (data: any) => {
  if (!ageChart.value) return;
  
  if (ageChartInstance) {
    ageChartInstance.destroy();
  }

  ageChartInstance = new Chart(ageChart.value, {
    type: 'bar',
    data: {
      labels: data.data.map((item: any) => item.label),
      datasets: [{
        label: 'Records',
        data: data.data.map((item: any) => item.value),
        backgroundColor: '#10B981',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
};

const createTimelineChart = (data: any) => {
  if (!timelineChart.value) return;
  
  if (timelineChartInstance) {
    timelineChartInstance.destroy();
  }

  timelineChartInstance = new Chart(timelineChart.value, {
    type: 'line',
    data: {
      labels: data.data.map((item: any) => item.label),
      datasets: [{
        label: 'Records Added',
        data: data.data.map((item: any) => item.value),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
};

// Auto-refresh every 5 minutes
let refreshInterval: number | null = null;

onMounted(() => {
  loadDashboardData();
  
  // Set up auto-refresh
  refreshInterval = setInterval(() => {
    loadDashboardData();
  }, 5 * 60 * 1000); // 5 minutes
});

onUnmounted(() => {
  // Cleanup charts
  if (genderChartInstance) genderChartInstance.destroy();
  if (countryChartInstance) countryChartInstance.destroy();
  if (ageChartInstance) ageChartInstance.destroy();
  if (timelineChartInstance) timelineChartInstance.destroy();
  
  // Clear refresh interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>
