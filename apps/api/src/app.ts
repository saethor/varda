import { RPCHandler } from '@orpc/server/fetch';
import { placeBodyLimit } from '@varda/record';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { AppAdapters } from './adapters.ts';
import { createRouter } from './router.ts';

export function createApp(adapters: AppAdapters): Hono {
  const rpc = new RPCHandler(createRouter(adapters));
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true }));

  // Signing up, in and out (Better Auth's endpoints in main.ts).
  app.on(['GET', 'POST'], '/api/auth/*', (c) => adapters.auth.handle(c.req.raw));

  // A body far over Record's limit for placing a stone is stopped here, unread, and answered the
  // way Record says: with the procedure's own defined error (spec #60).
  app.use(
    `/rpc/record/${placeBodyLimit.path.join('/')}`,
    bodyLimit({ maxSize: placeBodyLimit.maxBytes, onError: () => placeBodyLimit.tooLarge() }),
  );

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
