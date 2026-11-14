// Checks how the app is put together. Each context tests its own part of the contract (ADR 0008).
import { describe, expect, it } from 'vitest';
import { createTestApp } from './testing.ts';

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
});
