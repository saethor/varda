import { serve } from '@hono/node-server';
import type { Persons } from '@varda/shared';
import { createApp } from './app.ts';
import { createUuidV7Ids } from './ids.ts';

// The only code that reads the environment and opens connections (ADR 0008).
const port = Number(process.env.PORT ?? 4000);

// Until the Drizzle adapter (#24) and Better Auth (#25) arrive, nobody can sign
// in, so no procedure ever reaches the persons.
const notYetStored = async (): Promise<never> => {
  throw new Error('Persons are not stored yet: the Drizzle adapter arrives in #24.');
};
const persons: Persons = { createFor: notYetStored, findFor: notYetStored };

const app = createApp({
  shared: { persons },
  auth: { personFor: async () => null },
  ids: createUuidV7Ids(),
});

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`);
});
