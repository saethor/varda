import { RPCHandler } from '@orpc/server/fetch';
import { Hono } from 'hono';
import type { AppAdapters } from './adapters.ts';
import { createRouter } from './router.ts';

export function createApp(adapters: AppAdapters): Hono {
  const rpc = new RPCHandler(createRouter(adapters));
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true }));

  app.use('/rpc/*', async (c, next) => {
    const person = await adapters.auth.personFor(c.req.raw);
    const { matched, response } = await rpc.handle(c.req.raw, { prefix: '/rpc', context: { person } });
    if (matched) {
      return c.newResponse(response.body, response);
    }
    await next();
  });

  return app;
}
