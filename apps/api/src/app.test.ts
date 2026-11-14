// Checks how the app is put together. Each context tests its own part of the contract (ADR 0008).
import { safe } from '@orpc/client';
import { describe, expect, it } from 'vitest';
import { createTestApp } from './testing.ts';

const guðrún = { id: '00000000-0000-7000-8000-000000000001', name: 'Guðrún' };

describe('api', () => {
  it('reports health', async () => {
    const { app } = createTestApp();
    const response = await app.request('/health');
    expect(await response.json()).toEqual({ ok: true });
  });

  it('mounts the shared router under /rpc', async () => {
    const { client } = createTestApp();
    expect(await client.shared.sports.list()).not.toHaveLength(0);
  });

  it('mounts the login endpoints under /api/auth', async () => {
    const { app } = createTestApp();
    const signIn = await app.request('/api/auth/sign-in/email', { method: 'POST' });
    const session = await app.request('/api/auth/get-session');
    expect([signIn.status, session.status]).toEqual([200, 200]);
  });

  it('passes the signed-in person into the request context', async () => {
    const { client } = createTestApp({ as: guðrún });
    expect(await client.shared.persons.me()).toEqual(guðrún);
  });

  it('refuses nobody signed in with the typed error', async () => {
    const { client } = createTestApp();
    const { error, isDefined } = await safe(client.shared.persons.me());
    expect(isDefined && error.code).toBe('UNAUTHORIZED');
  });
});
