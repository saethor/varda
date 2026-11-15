import { expect, it } from 'vitest';
import { createRealApp } from '../real-app.ts';

const { shared, postAuth, clientFor } = createRealApp({ devMenu: false });

const uuidV7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// The only test showing that signing up creates the person (the after-user-created hook),
// and that signing in with email and password reaches them through the contract.
it('creates the person on sign-up, and tells them who they are after signing in', async () => {
  const credentials = { email: `anna-${crypto.randomUUID()}@example.com`, password: 'correct horse battery staple' };

  const signUp = await postAuth('sign-up/email', { name: 'Anna', ...credentials });
  const { user } = (await signUp.json()) as { user: { id: string } };
  // Before any request is signed in, so the safety net can't have created them.
  const created = await shared.persons.findFor(user.id);

  const signIn = await postAuth('sign-in/email', credentials);
  const me = await clientFor(signIn).shared.persons.me();

  expect(created).toEqual({ id: expect.stringMatching(uuidV7), name: 'Anna' });
  expect(me).toEqual(created);
});
