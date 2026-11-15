import { defineConfig } from 'vitest/config';

// Plain functions only (no component tests), so none of the app's Vite plugins are needed.
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } });
