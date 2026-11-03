import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: { manualChunks: { 'react-vendor': ['react', 'react-dom'] } }
    }
  },
  test: {
    globals: true,
    environment: 'node',
  },
  server: {
    port: 5173,
    open: false
  }
});
