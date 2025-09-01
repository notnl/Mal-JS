import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 5173,

    proxy: {
      '/api': {
        target: `http://127.0.0.1:8000`,
        changeOrigin: true,

        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🔄 Proxy error (API server may be starting):', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`🔄 Proxying ${req.method} ${req.url} to ${proxyReq.getHeader('host')}`);
          });
        },

      }
    }
  },
});
