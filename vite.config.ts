// // C:\PSS\UserAccessManager\vite.config.ts
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import path from "path";
// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// export default defineConfig({
//   plugins: [
//     react(),
//     runtimeErrorOverlay(),
//     ...(process.env.NODE_ENV !== "production" &&
//     process.env.REPL_ID !== undefined
//       ? [
//           await import("@replit/vite-plugin-cartographer").then((m) =>
//             m.cartographer(),
//           ),
//         ]
//       : []),
//   ],
//   resolve: {
//     alias: {
//       "@": path.resolve(import.meta.dirname, "client", "src"),
//       "@shared": path.resolve(import.meta.dirname, "shared"),
//       "@assets": path.resolve(import.meta.dirname, "attached_assets"),
//     },
//   },
//   root: path.resolve(import.meta.dirname, "client"),
//   build: {
//     outDir: path.resolve(import.meta.dirname, "dist/public"),
//     emptyOutDir: true,
//   },
//   server: {
//     fs: {
//       strict: true,
//       deny: ["**/.*"],
//     },
//     proxy: {
//       "/api": {
//         target: "http://localhost:5000",
//         changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/api/, "/api"),
//       },
//     },
//   },
// });

// C:\PSS\UserAccessManager\vite.config.ts
// vite.config.ts
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
    host: '0.0.0.0',
    port: 5173,
    open: false,
    allowedHosts: [
      'admin.fertiliwell.in',  // ✅ allow your domain
    ],
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET || "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy) => {
          proxy.on('error', (err) => console.log('proxy error', err));
          proxy.on('proxyReq', (proxyReq, req) => console.log('Proxying:', req.method, req.url));
          proxy.on('proxyRes', (proxyRes, req) => console.log('Proxy response:', proxyRes.statusCode, req.url));
        }
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});