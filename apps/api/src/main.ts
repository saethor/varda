import { serve } from '@hono/node-server';
import { createSharedAdapters, createSharedReaders } from '@varda/shared';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createApp } from './app.ts';
import { createBetterAuthAdapter } from './auth/better-auth.ts';
import { required } from './env.ts';
import { createUuidV7Ids } from './ids.ts';

// The only code that reads the environment and opens connections (ADR 0008).
const port = Number(process.env.PORT ?? 4000);

const db = drizzle({ client: new Pool({ connectionString: required('DATABASE_URL') }) });
const shared = createSharedAdapters({ db, ids: createUuidV7Ids() });

const app = createApp({
  shared,
  auth: createBetterAuthAdapter({
    db,
    secret: required('BETTER_AUTH_SECRET'),
    baseURL: required('BETTER_AUTH_URL'),
    persons: createSharedReaders(shared).persons,
  }),
});

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`);
});
