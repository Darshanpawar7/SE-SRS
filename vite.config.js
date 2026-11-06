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
    coverage: {
      provider: 'v8',
      // Measure every source file, including ones no unit test imports.
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/tests/**', 'src/main.jsx'],
      reporter: ['text', 'html', 'json-summary', 'json'],
      reportsDirectory: 'coverage',
      // Instrumentation slows the Kanban timing benchmark past its budget; still report.
      reportOnFailure: true
    }
  },
  server: {
    port: 5173,
    open: false
  }
});
