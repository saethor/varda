// Test-only: builds the app with in-memory fakes for every adapter (ADR 0008).
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { ContractRouterClient } from '@orpc/contract';
import type { Contract } from '@varda/contract';
import type { AppAdapters } from './adapters.ts';
import { createApp } from './app.ts';

export type TestApp = {
  /** The typed oRPC client, the same interface the web app calls. Assert through this. */
  client: ContractRouterClient<Contract>;
  /** The fakes behind the seam, for seeding state the contract can't create. */
  fakes: AppAdapters;
  app: ReturnType<typeof createApp>;
};

export function createTestApp({ overrides = {} }: { overrides?: Partial<AppAdapters> } = {}): TestApp {
  const fakes: AppAdapters = { ...overrides };
  const app = createApp(fakes);
  const client: ContractRouterClient<Contract> = createORPCClient(
    new RPCLink({ url: 'http://api.test/rpc', fetch: async (request) => await app.fetch(request) }),
  );
  return { client, fakes, app };
}
