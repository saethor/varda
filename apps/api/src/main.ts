import { serve } from '@hono/node-server';
import { createSharedAdapters } from '@varda/shared';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createApp } from './app.ts';
import { createUuidV7Ids } from './ids.ts';

// The only code that reads the environment and opens connections (ADR 0008).
const port = Number(process.env.PORT ?? 4000);
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not set (see .env.example).');

const db = drizzle({ client: new Pool({ connectionString: databaseUrl }) });

const app = createApp({
  shared: createSharedAdapters({ db }),
  // Until Better Auth arrives (#25), nobody can sign in.
  auth: { personFor: async () => null },
  ids: createUuidV7Ids(),
});

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`);
});
