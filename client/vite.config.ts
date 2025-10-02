import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            if (id.includes('socket.io-client')) {
              return 'socket-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            return 'vendor';
          }
          
          // Feature-based chunks
          if (id.includes('trading-options') || id.includes('use-active-trades')) {
            return 'trading';
          }
          if (id.includes('auth-page') || id.includes('use-auth')) {
            return 'auth';
          }
          if (id.includes('admin-')) {
            return 'admin';
          }
          if (id.includes('news-page') || id.includes('wallet-page')) {
            return 'pages';
          }
        }
      }
    },
    chunkSizeWarningLimit: 500
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true,
      },
    },
  },
});