import { describe, expect, it } from 'vitest';
import { createSharedFakes } from '../testing/index.ts';
import { createSharedReaders } from './readers.ts';

describe('the persons reader', () => {
  it('lists everyone by name in Icelandic order', async () => {
    const { persons } = createSharedReaders(createSharedFakes());
    // Out of order, and Þ before Ö is Icelandic: creation order, code points and English all disagree.
    for (const name of ['Örn', 'Þór', 'Anna']) await persons.forLoginAccount({ id: `login-account-of-${name}`, name });

    const names = (await persons.everyone()).map((person) => person.name);

    expect(names).toEqual(['Anna', 'Þór', 'Örn']);
  });
});
