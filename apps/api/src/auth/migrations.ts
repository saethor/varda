import { fileURLToPath } from 'node:url';

/** The auth schema's Drizzle migrations (Better Auth's tables), run by `pnpm db:migrate`. */
export const authMigrations = {
  name: 'auth',
  folder: fileURLToPath(new URL('./migrations', import.meta.url)),
};
