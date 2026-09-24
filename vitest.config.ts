import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Shared Vitest config. Each workspace project extends this and overrides
 * include/environment/setupFiles.
 */
export default defineConfig({
  plugins: [react()],
  // Tests don't render Tailwind; skip PostCSS entirely.
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/lib/**', 'src/app/**/api/**'],
      exclude: [
        'src/lib/**/index.ts',
        'src/lib/types.ts',
        'src/lib/**/*.d.ts',
        '**/*.test.ts',
      ],
      thresholds: {
        // Soft targets; CI scripts may promote these to hard gates.
        'src/lib/services/**': { lines: 90, branches: 85 },
        'src/lib/validators/**': { lines: 95, branches: 90 },
        'src/lib/storage/**': { lines: 80, branches: 70 },
        'src/lib/**': { lines: 80, branches: 75 },
      },
    },
  },
});