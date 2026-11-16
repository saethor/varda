import { fileURLToPath } from 'node:url';

/** Record's Drizzle migrations, run by `pnpm db:migrate` (ADR 0006). */
export const recordMigrations = {
  name: 'record',
  folder: fileURLToPath(new URL('./migrations', import.meta.url)),
};
