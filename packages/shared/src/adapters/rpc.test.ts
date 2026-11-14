import { createRouterClient } from '@orpc/server';
import { describe, expect, it } from 'vitest';
import { createSharedRouter } from './rpc.ts';

const client = createRouterClient(createSharedRouter());

describe('shared contract', () => {
  it('lists every sport with its group', async () => {
    const sports = await client.sports.list();
    expect(sports).toContainEqual({ sport: 'treadmill-running', group: 'running' });
    expect(sports).toContainEqual({ sport: 'cycling', group: 'cross-training' });
    expect(sports).toHaveLength(11);
  });
});
