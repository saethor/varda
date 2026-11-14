// `pnpm db:migrate`: applies every context's migrations (ADR 0006). Idempotent.
import { sharedMigrations } from '@varda/shared/migrations';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

// One entry per migrations folder: each context's, and auth's once Better Auth arrives.
// Each folder gets its own table in the `drizzle` schema, because the migrator
// skips every migration older than the newest one recorded in its table.
const folders: { name: string; folder: string }[] = [sharedMigrations];

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not set (see .env.example).');

const pool = new Pool({ connectionString: databaseUrl });
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
