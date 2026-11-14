import { serve } from '@hono/node-server';
import { createSharedAdapters } from '@varda/shared';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createApp } from './app.ts';
import { createBetterAuthAdapter } from './auth/better-auth.ts';
import { createUuidV7Ids } from './ids.ts';

// The only code that reads the environment and opens connections (ADR 0008).
const port = Number(process.env.PORT ?? 4000);

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (see .env.example).`);
  return value;
}

const db = drizzle({ client: new Pool({ connectionString: required('DATABASE_URL') }) });
const shared = createSharedAdapters({ db });
const ids = createUuidV7Ids();

const app = createApp({
  shared,
  auth: createBetterAuthAdapter({
    db,
    secret: required('BETTER_AUTH_SECRET'),
    baseURL: required('BETTER_AUTH_URL'),
    shared: { ...shared, ids },
  }),
  ids,
});

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`);
});
