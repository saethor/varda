// Test-only: the real app for the adapter tests, built exactly as main.ts builds it, against a
// migrated database (DATABASE_URL). The adapter suite's counterpart of createTestApp.
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { ContractRouterClient } from '@orpc/contract';
import type { Contract } from '@varda/contract';
import { createSharedAdapters, createSharedReaders } from '@varda/shared';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll } from 'vitest';
import type { Auth } from './adapters.ts';
import { createApp } from './app.ts';
import { createBetterAuthAdapter } from './auth/better-auth.ts';
import { createUuidV7Ids } from './ids.ts';

export type RealApp = {
  shared: ReturnType<typeof createSharedAdapters>;
  auth: Auth;
  /** The origin the auth adapter was built with. */
  baseURL: string;
  /** GET `/api/auth/<path>`. */
  getAuth(path: string): Promise<Response>;
  /** POST `/api/auth/<path>` with a JSON body. */
  postAuth(path: string, body: object): Promise<Response>;
  /** The typed oRPC client, signed in with the session cookie a login endpoint answered with. */
  clientFor(signedIn: Response): ContractRouterClient<Contract>;
};

/** Builds the real app, with VARDA_DEV_MENU on or off. Its connection pool closes after the file's tests. */
export function createRealApp({ devMenu }: { devMenu: boolean }): RealApp {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  afterAll(async () => await pool.end());

  const db = drizzle({ client: pool });
  const baseURL = 'http://localhost:4000';
  const shared = createSharedAdapters({ db, ids: createUuidV7Ids() });
  const auth = createBetterAuthAdapter({
    db,
    secret: 'adapter-test-secret-at-least-32-characters',
    baseURL,
    persons: createSharedReaders(shared).persons,
    devMenu,
  });
  const app = createApp({ shared, auth });

  return {
    shared,
    auth,
    baseURL,
    getAuth: async (path) => await app.request(`${baseURL}/api/auth/${path}`),
    postAuth: async (path, body) =>
      await app.request(`${baseURL}/api/auth/${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
    clientFor: (signedIn) =>
      createORPCClient(
        new RPCLink({
          url: `${baseURL}/rpc`,
          headers: { cookie: sessionCookie(signedIn) },
          fetch: async (request) => await app.fetch(request),
        }),
      ),
  };
}

function sessionCookie(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}
