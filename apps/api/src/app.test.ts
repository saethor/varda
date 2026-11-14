import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { ContractRouterClient } from '@orpc/contract';
import type { Contract } from '@varda/contract';
import { describe, expect, it } from 'vitest';
import { app } from './app.ts';

const client: ContractRouterClient<Contract> = createORPCClient(
  new RPCLink({ url: 'http://api.test/rpc', fetch: async (request) => await app.fetch(request) }),
);

describe('api', () => {
  it('reports health', async () => {
    const response = await app.request('/health');
    expect(await response.json()).toEqual({ ok: true });
  });

  it('serves the shared contract over oRPC', async () => {
    const sports = await client.shared.sports.list();
    expect(sports).toContainEqual({ sport: 'treadmill-running', group: 'running' });
  });
});
