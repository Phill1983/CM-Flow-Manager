import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'packages/**/src/**/*.{test,spec}.ts',
      'modules/**/src/**/*.{test,spec}.ts',
      'apps/desktop/src/**/*.{test,spec}.{ts,tsx}',
    ],
    environment: 'node',
  },
});
