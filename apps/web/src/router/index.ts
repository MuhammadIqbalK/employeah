import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from '../views/Dashboard.vue';
import Upload from '../views/Upload.vue';
import Records from '../views/Records.vue';

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
  },
  {
    path: '/upload',
    name: 'Upload',
    component: Upload,
  },
  {
    path: '/records',
    name: 'Records',
    component: Records,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
