import { createRouterClient, safe } from '@orpc/server';
import { describe, expect, it } from 'vitest';
import { createSharedFakes } from '../testing/index.ts';
import { createSharedRouter, type SharedContext } from './rpc.ts';

function clientFor(context: SharedContext, adapters = createSharedFakes()) {
  return createRouterClient(createSharedRouter(adapters), { context });
}

describe('shared contract', () => {
  it('lists every sport with its group', async () => {
    const sports = await clientFor({ person: null }).sports.list();
    expect(sports).toContainEqual({ sport: 'treadmill-running', group: 'running' });
    expect(sports).toContainEqual({ sport: 'cycling', group: 'cross-training' });
    expect(sports).toHaveLength(11);
  });

  it('tells a signed-in person who they are', async () => {
    const adapters = createSharedFakes();
    // A person comes from a login account, which the contract can't create.
    const guðrún = await adapters.persons.createFor({
      id: '00000000-0000-7000-8000-000000000001',
      loginAccount: 'login-account-1',
      name: 'Guðrún',
    });

    expect(await clientFor({ person: guðrún.id }, adapters).persons.me()).toEqual(guðrún);
  });

  it('refuses someone who is not signed in with the typed error', async () => {
    const { error, isDefined } = await safe(clientFor({ person: null }).persons.me());
    expect(isDefined && error.code).toBe('UNAUTHORIZED');
  });
});
