import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    allowedHosts: ["dev.iqbaldevs.my.id"],
    host: true, 
    port: 5173,
  },
});
