import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiGatewayProxy = {
  target: 'http://localhost:8080',
  changeOrigin: true,
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': apiGatewayProxy,
      '/auth': apiGatewayProxy,
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
