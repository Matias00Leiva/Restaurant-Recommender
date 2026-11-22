
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiProxy = {
  "/api": {
    target: "http://127.0.0.1:8000",
    changeOrigin: false,
  },
};

export default defineConfig({
  plugins: [react()],

  // Local development server.
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: apiProxy,
  },

  // Local production preview.
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
    proxy: apiProxy,
  },
});
