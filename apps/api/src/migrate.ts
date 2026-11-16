// `pnpm db:migrate`: applies every context's migrations (ADR 0006). Idempotent.
import { recordMigrations } from '@varda/record/migrations';
import { sharedMigrations } from '@varda/shared/migrations';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { authMigrations } from './auth/migrations.ts';
import { required } from './env.ts';

// One entry per migrations folder: each context's, and auth's (Better Auth's tables).
// Each folder gets its own table in the `drizzle` schema, because the migrator
// skips every migration older than the newest one recorded in its table.
const folders = [sharedMigrations, recordMigrations, authMigrations];

const pool = new Pool({ connectionString: required('DATABASE_URL') });
try {
  const db = drizzle({ client: pool });
  for (const { name, folder } of folders) {
    await migrate(db, {
      migrationsFolder: folder,
      migrationsSchema: 'drizzle',
      migrationsTable: `__${name}_migrations`,
    });
    console.log(`migrated ${name}`);
  }
} finally {
  await pool.end();
}
