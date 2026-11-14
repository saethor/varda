import { fileURLToPath } from 'node:url';

/** Shared's Drizzle migrations, run by `pnpm db:migrate` (ADR 0006). */
export const sharedMigrations = {
  name: 'shared',
  folder: fileURLToPath(new URL('./migrations', import.meta.url)),
};
