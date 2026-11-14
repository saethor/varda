import { describe, expect, it } from 'vitest';
import { createSharedFakes } from '../testing/index.ts';
import { resolvePerson } from './resolve-person.ts';

const loginAccount = { id: 'login-account-1', name: 'Guðrún' };

describe('resolving a login account to a person', () => {
  it('gives a login account without a person exactly one, named after it', async () => {
    const adapters = createSharedFakes();

    const first = await resolvePerson(adapters, loginAccount);
    const next = await resolvePerson(adapters, loginAccount);

    expect(first.name).toBe('Guðrún');
    expect(next).toEqual(first);
  });

  it('still gives one person when the first resolutions race', async () => {
    const adapters = createSharedFakes();

    const [a, b, c] = await Promise.all([
      resolvePerson(adapters, loginAccount),
      resolvePerson(adapters, loginAccount),
      resolvePerson(adapters, loginAccount),
    ]);

    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });
});
