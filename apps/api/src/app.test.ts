import { describe, expect, it } from 'vitest';
import { createTestApp } from './testing.ts';

describe('api', () => {
  it('reports health', async () => {
    const { app } = createTestApp();
    const response = await app.request('/health');
    expect(await response.json()).toEqual({ ok: true });
  });

  it('serves the shared contract over oRPC', async () => {
    const { client } = createTestApp();
    const sports = await client.shared.sports.list();
    expect(sports).toContainEqual({ sport: 'treadmill-running', group: 'running' });
  });
});
