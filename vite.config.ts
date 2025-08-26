import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 5173,
    open: false, // Disable auto-open in container environment
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'admin.fertiwell.info'  // Add your domain here
    ],
    proxy: {
      "/api": {
        target: "https://adminapi.fertiwell.info", // Updated to use your backend domain
        changeOrigin: true,
        secure: false, // For HTTP (non-SSL)
        rewrite: (path) => path, // Keep the /api prefix
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});

