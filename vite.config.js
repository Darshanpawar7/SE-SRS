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
    // Application tests use Vitest; reporting gate tests use node:test separately.
    include: ['src/tests/**/*.{test,spec}.{js,jsx,mjs}'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      // Measure every source file, including ones no unit test imports.
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/tests/**', 'src/main.jsx'],
      reporter: ['text', 'html', 'json-summary', 'json'],
      reportsDirectory: 'coverage',
      // The unchanged timing benchmark runs in npm test, without instrumentation.
      reportOnFailure: true
    }
  },
  server: {
    port: 5173,
    open: false
  }
});
