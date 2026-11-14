import { configDefaults, defineConfig } from 'vitest/config';

// `pnpm test` never touches Postgres (ADR 0007): adapter tests run only in `pnpm test:adapters`.
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, '**/*.adapters.test.ts'] },
});
