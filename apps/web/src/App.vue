<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <h1 class="text-xl font-bold text-gray-900">Employeah</h1>
            </div>
            <div class="ml-10 flex items-baseline space-x-4">
              <router-link
                to="/"
                class="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                :class="$route.name === 'Dashboard' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'"
              >
                Dashboard
              </router-link>
              <router-link
                to="/upload"
                class="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                :class="$route.name === 'Upload' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'"
              >
                Upload Excel
              </router-link>
              <router-link
                to="/records"
                class="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                :class="$route.name === 'Records' ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:text-gray-700'"
              >
                Records
              </router-link>
            </div>
          </div>
          <div class="flex items-center">
            <div class="text-sm text-gray-500">
              Employee Management System
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-auto">
      <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div class="text-center text-sm text-gray-500">
          © 2024 Employeah. Built with Vue.js, Hono, and PostgreSQL.
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  console.log('Employeah App mounted');
});
</script>
