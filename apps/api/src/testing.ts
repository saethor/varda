// Test-only: builds the app with in-memory fakes for every adapter (ADR 0008).
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { ContractRouterClient } from '@orpc/contract';
import type { Contract } from '@varda/contract';
import type { Person } from '@varda/shared';
import { createSharedFakes } from '@varda/shared/testing';
import type { AppAdapters, Auth } from './adapters.ts';
import { createApp } from './app.ts';

export type TestApp = {
  /** The typed oRPC client, the same interface the web app calls. Assert through this. */
  client: ContractRouterClient<Contract>;
  /** The fakes behind the seam, for seeding state the contract can't create. */
  fakes: AppAdapters;
  app: ReturnType<typeof createApp>;
};

export type TestAppOptions = {
  /** The person every request is signed in as. Leave out for nobody signed in. */
  as?: Person;
  overrides?: Partial<AppAdapters>;
};

export function createTestApp({ as, overrides = {} }: TestAppOptions = {}): TestApp {
  const shared = overrides.shared ?? createSharedFakes();
  const fakes: AppAdapters = { shared, auth: signedInAs(as, shared), ...overrides };
  const app = createApp(fakes);
  const client: ContractRouterClient<Contract> = createORPCClient(
    new RPCLink({ url: 'http://api.test/rpc', fetch: async (request) => await app.fetch(request) }),
  );
  return { client, fakes, app };
}

/** The fake `auth` adapter: every request is signed in as `as`, or nobody when it is left out. */
function signedInAs(as: Person | undefined, shared: AppAdapters['shared']): Auth {
  return {
    async personFor() {
      if (as === undefined) return null;
      // Like the real adapter, the person exists from their (fake) login account's first request.
      const person = await shared.persons.createFor({ ...as, loginAccount: `login-account-of-${as.id}` });
      return person.id;
    },
    // Login endpoints answer with an empty 200, so tests can tell they are mounted.
    handle: async () => new Response(null, { status: 200 }),
  };
}
