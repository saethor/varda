import { serve } from '@hono/node-server';
import { createApp } from './app.ts';

// The only code that reads the environment and opens connections (ADR 0008).
const port = Number(process.env.PORT ?? 4000);

const app = createApp({});

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`);
});
