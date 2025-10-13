<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white shadow rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Employee Records</h1>
          <p class="mt-1 text-sm text-gray-500">
            Manage and view employee records
          </p>
        </div>
        <div class="flex space-x-3">
          <button
            @click="exportRecords"
            class="btn btn-secondary"
            :disabled="isExporting"
          >
            <span v-if="isExporting">Exporting...</span>
            <span v-else>Export CSV</span>
          </button>
          <router-link to="/upload" class="btn btn-primary">
            Upload Excel
          </router-link>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white shadow rounded-lg p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search by name or country..."
            class="input"
            @input="debouncedSearch"
          />
        </div>

        <!-- Gender Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select v-model="filters.gender" class="input" @change="loadRecords">
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <!-- Country Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select v-model="filters.country" class="input" @change="loadRecords">
            <option value="">All Countries</option>
            <option v-for="country in countries" :key="country" :value="country">
              {{ country }}
            </option>
          </select>
        </div>

        <!-- Age Range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
          <div class="flex space-x-2">
            <input
              v-model="filters.ageMin"
              type="number"
              placeholder="Min"
              min="0"
              max="99"
              class="input"
              @change="loadRecords"
            />
            <input
              v-model="filters.ageMax"
              type="number"
              placeholder="Max"
              min="0"
              max="99"
              class="input"
              @change="loadRecords"
            />
          </div>
        </div>
      </div>

      <!-- Additional Filters -->
      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Date Range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date From</label>
          <input
            v-model="filters.dateFrom"
            type="date"
            class="input"
            @change="loadRecords"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date To</label>
          <input
            v-model="filters.dateTo"
            type="date"
            class="input"
            @change="loadRecords"
          />
        </div>

        <!-- Sort Options -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select v-model="filters.sortBy" class="input" @change="loadRecords">
            <option value="id">ID</option>
            <option value="firstname">First Name</option>
            <option value="lastname">Last Name</option>
            <option value="gender">Gender</option>
            <option value="country">Country</option>
            <option value="age">Age</option>
            <option value="date">Date</option>
            <option value="createdAt">Created At</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Order</label>
          <select v-model="filters.sortOrder" class="input" @change="loadRecords">
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      <!-- Clear Filters -->
      <div class="mt-4 flex justify-end">
        <button @click="clearFilters" class="btn btn-secondary">
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Records Table -->
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">
            Records ({{ pagination.total.toLocaleString() }})
          </h3>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500">Show:</span>
            <select v-model="filters.limit" class="input" @change="loadRecords">
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  :checked="selectedRecords.length === records.length && records.length > 0"
                  @change="toggleSelectAll"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th>ID</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Gender</th>
              <th>Country</th>
              <th>Age</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="9" class="text-center py-8 text-gray-500">
                Loading records...
              </td>
            </tr>
            <tr v-else-if="records.length === 0">
              <td colspan="9" class="text-center py-8 text-gray-500">
                No records found
              </td>
            </tr>
            <tr v-else v-for="record in records" :key="record.id" class="hover:bg-gray-50">
              <td>
                <input
                  type="checkbox"
                  :value="record.id"
                  v-model="selectedRecords"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </td>
              <td class="font-medium">{{ record.id }}</td>
              <td>{{ record.firstname }}</td>
              <td>{{ record.lastname }}</td>
              <td>
                <span class="px-2 py-1 text-xs font-medium rounded-full"
                      :class="getGenderBadgeClass(record.gender)">
                  {{ record.gender }}
                </span>
              </td>
              <td>{{ record.country }}</td>
              <td>{{ record.age }}</td>
              <td>{{ formatDate(record.date) }}</td>
              <td>
                <div class="flex space-x-2">
                  <button
                    @click="editRecord(record)"
                    class="text-primary-600 hover:text-primary-900 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteRecord(record.id)"
                    class="text-danger-600 hover:text-danger-900 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bulk Actions -->
      <div v-if="selectedRecords.length > 0" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-700">
            {{ selectedRecords.length }} record(s) selected
          </span>
          <div class="flex space-x-2">
            <button @click="bulkUpdate" class="btn btn-secondary">
              Bulk Update
            </button>
            <button @click="bulkDelete" class="btn btn-danger">
              Bulk Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing {{ ((pagination.page - 1) * pagination.limit) + 1 }} to 
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of 
            {{ pagination.total.toLocaleString() }} results
          </div>
          <div class="flex space-x-2">
            <button
              @click="goToPage(pagination.page - 1)"
              :disabled="!pagination.hasPrev"
              class="btn btn-secondary"
              :class="{ 'opacity-50 cursor-not-allowed': !pagination.hasPrev }"
            >
              Previous
            </button>
            <span class="px-3 py-2 text-sm text-gray-700">
              Page {{ pagination.page }} of {{ pagination.totalPages }}
            </span>
            <button
              @click="goToPage(pagination.page + 1)"
              :disabled="!pagination.hasNext"
              class="btn btn-secondary"
              :class="{ 'opacity-50 cursor-not-allowed': !pagination.hasNext }"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingRecord" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Edit Record</h3>
          <form @submit.prevent="saveRecord" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                v-model="editingRecord.firstname"
                type="text"
                maxlength="10"
                required
                class="input"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                v-model="editingRecord.lastname"
                type="text"
                maxlength="10"
                required
                class="input"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <input
                v-model="editingRecord.gender"
                type="text"
                maxlength="6"
                required
                class="input"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                v-model="editingRecord.country"
                type="text"
                maxlength="20"
                required
                class="input"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                v-model="editingRecord.age"
                type="number"
                min="0"
                max="99"
                required
                class="input"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                v-model="editingRecord.date"
                type="date"
                required
                class="input"
              />
            </div>
            <div class="flex justify-end space-x-3">
              <button type="button" @click="cancelEdit" class="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isSaving">
                <span v-if="isSaving">Saving...</span>
                <span v-else>Save</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { recordsService, dashboardService, type Record } from '../services/api';

// Reactive state
const records = ref<Record[]>([]);
const countries = ref<string[]>([]);
const isLoading = ref(false);
const isExporting = ref(false);
const isSaving = ref(false);
const selectedRecords = ref<number[]>([]);
const editingRecord = ref<Record | null>(null);

// Filters
const filters = ref({
  page: 1,
  limit: 50,
  search: '',
  gender: '',
  country: '',
  ageMin: '',
  ageMax: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'id',
  sortOrder: 'asc',
});

// Pagination
const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
});

// Search debounce
let searchTimeout: number | null = null;

// Load records
const loadRecords = async () => {
  try {
    isLoading.value = true;
    const response = await recordsService.getRecords(filters.value);
    records.value = response.records;
    pagination.value = response.pagination;
  } catch (error) {
    console.error('Failed to load records:', error);
  } finally {
    isLoading.value = false;
  }
};

// Load countries
const loadCountries = async () => {
  try {
    const data = await dashboardService.getCountries();
    countries.value = data;
  } catch (error) {
    console.error('Failed to load countries:', error);
  }
};

// Debounced search
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    filters.value.page = 1;
    loadRecords();
  }, 500);
};

// Clear filters
const clearFilters = () => {
  filters.value = {
    page: 1,
    limit: 50,
    search: '',
    gender: '',
    country: '',
    ageMin: '',
    ageMax: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'id',
    sortOrder: 'asc',
  };
  loadRecords();
};

// Pagination
const goToPage = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    filters.value.page = page;
    loadRecords();
  }
};

// Selection
const toggleSelectAll = () => {
  if (selectedRecords.value.length === records.value.length) {
    selectedRecords.value = [];
  } else {
    selectedRecords.value = records.value.map(r => r.id);
  }
};

// Edit record
const editRecord = (record: Record) => {
  editingRecord.value = { ...record };
};

const cancelEdit = () => {
  editingRecord.value = null;
};

const saveRecord = async () => {
  if (!editingRecord.value) return;

  try {
    isSaving.value = true;
    await recordsService.updateRecord(editingRecord.value.id, editingRecord.value);
    await loadRecords();
    editingRecord.value = null;
  } catch (error) {
    console.error('Failed to update record:', error);
    alert('Failed to update record. Please try again.');
  } finally {
    isSaving.value = false;
  }
};

// Delete record
const deleteRecord = async (id: number) => {
  if (!confirm('Are you sure you want to delete this record?')) return;

  try {
    await recordsService.deleteRecord(id);
    await loadRecords();
  } catch (error) {
    console.error('Failed to delete record:', error);
    alert('Failed to delete record. Please try again.');
  }
};

// Bulk operations
const bulkUpdate = () => {
  if (selectedRecords.value.length === 0) return;
  // Implement bulk update logic
  alert('Bulk update feature coming soon!');
};

const bulkDelete = async () => {
  if (selectedRecords.value.length === 0) return;
  
  if (!confirm(`Are you sure you want to delete ${selectedRecords.value.length} records?`)) return;

  try {
    for (const id of selectedRecords.value) {
      await recordsService.deleteRecord(id);
    }
    selectedRecords.value = [];
    await loadRecords();
  } catch (error) {
    console.error('Failed to delete records:', error);
    alert('Failed to delete records. Please try again.');
  }
};

// Export records
const exportRecords = async () => {
  try {
    isExporting.value = true;
    
    // Get all records with current filters
    const response = await recordsService.getRecords({
      ...filters.value,
      limit: 10000, // Large limit to get all records
    });
    
    // Create CSV content
    const headers = ['ID', 'First Name', 'Last Name', 'Gender', 'Country', 'Age', 'Date'];
    const csvContent = [
      headers.join(','),
      ...response.records.map(record => [
        record.id,
        record.firstname,
        record.lastname,
        record.gender,
        record.country,
        record.age,
        record.date,
      ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employee_records_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export records:', error);
    alert('Failed to export records. Please try again.');
  } finally {
    isExporting.value = false;
  }
};

// Utility functions
const getGenderBadgeClass = (gender: string) => {
  switch (gender.toLowerCase()) {
    case 'male':
      return 'bg-blue-100 text-blue-800';
    case 'female':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

// Watch for filter changes
watch(() => filters.value.page, () => {
  loadRecords();
});

watch(() => filters.value.limit, () => {
  filters.value.page = 1;
  loadRecords();
});

// Load data on mount
onMounted(() => {
  loadRecords();
  loadCountries();
});
</script>
