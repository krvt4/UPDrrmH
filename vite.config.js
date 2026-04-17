import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: true,
    port: 8000,
    proxy: {
      // Express API (Contact, etc.)
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },

      // Python chatbot API
      "/chatbot": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/chatbot/, ""),
      },
    },
  },
});