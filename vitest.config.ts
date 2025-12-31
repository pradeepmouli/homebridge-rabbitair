import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      enabled: true,
      provider: 'istanbul',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['**/*.d.ts', 'test/**', 'dist/**'],
    },
    include: ['test/**/*.test.ts'],
    testTimeout: 5000,
  },
});
