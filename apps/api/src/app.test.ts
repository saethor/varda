// Checks how the app is put together. Each context tests its own part of the contract (ADR 0008).
import { safe } from '@orpc/client';
import { watchFile } from '@varda/record/watch-files';
import { describe, expect, it } from 'vitest';
import { createTestApp } from './testing.ts';

const guðrún = { id: '00000000-0000-7000-8000-000000000001', name: 'Guðrún' };

describe('api', () => {
  it('reports health', async () => {
    const { app } = createTestApp();
    const response = await app.request('/health');
    expect(await response.json()).toEqual({ ok: true });
  });

  it('mounts the login endpoints under /api/auth', async () => {
    const { app } = createTestApp();
    const signIn = await app.request('/api/auth/sign-in/email', { method: 'POST' });
    const session = await app.request('/api/auth/get-session');
    expect([signIn.status, session.status]).toEqual([200, 200]);
  });

  // These two also show the shared router is mounted under /rpc.
  it('passes the signed-in person into the request context', async () => {
    const { client } = createTestApp({ as: guðrún });
    expect(await client.shared.persons.me()).toEqual(guðrún);
  });

  // Also shows a watch file travels to Record as a file (multipart) through /rpc.
  it('mounts the record router under /rpc', async () => {
    const { client } = createTestApp({ as: guðrún });
    const file = new File([watchFile() as Uint8Array<ArrayBuffer>], 'run.fit');

    const { stoneId } = await client.record.stones.place({ file });

    const stones = await client.record.stones.list({ from: '2026-11-02', to: '2026-11-02' });
    expect(stones.map(({ id, fileName }) => ({ id, fileName }))).toEqual([{ id: stoneId, fileName: 'run.fit' }]);
  });

  // Record asks Shared's coaching access reader who may open a stone.
  it("opens a stone for its athlete, and answers another person's stone as not found", async () => {
    const { client, fakes } = createTestApp({ as: guðrún });
    const { stoneId } = await client.record.stones.place({
      file: new File([watchFile() as Uint8Array<ArrayBuffer>], 'run.fit'),
    });
    const jón = createTestApp({
      as: { id: '00000000-0000-7000-8000-000000000002', name: 'Jón' },
      overrides: { shared: fakes.shared, record: fakes.record },
    });

    const opened = await client.record.stones.get({ stoneId });
    const { error, isDefined } = await safe(jón.client.record.stones.get({ stoneId }));

    expect([opened.id, isDefined && error.code]).toEqual([stoneId, 'NOT_FOUND']);
  });

  it('turns away a body over the upload limit with the typed error', async () => {
    const { client } = createTestApp({ as: guðrún });
    const file = new File([new Uint8Array(26_000_000)], 'huge.fit');

    const { error, isDefined } = await safe(client.record.stones.place({ file }));

    expect(isDefined && { code: error.code, status: error.status, data: error.data }).toEqual({
      code: 'TURNED_AWAY',
      status: 413,
      data: { reason: 'too-large' },
    });
  });

  it('refuses nobody signed in with the typed error', async () => {
    const { client } = createTestApp();
    const { error, isDefined } = await safe(client.shared.persons.me());
    expect(isDefined && error.code).toBe('UNAUTHORIZED');
  });
});
