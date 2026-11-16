import { ORPCError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { maxWatchFileBytes } from '@varda/record';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { AppAdapters } from './adapters.ts';
import { createRouter } from './router.ts';

/** Room over the largest watch file for the rest of a multipart body (boundaries, part headers, the JSON). */
const multipartHeadroom = 64 * 1024;

export function createApp(adapters: AppAdapters): Hono {
  const rpc = new RPCHandler(createRouter(adapters));
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true }));

  // Signing up, in and out (Better Auth's endpoints in main.ts).
  app.on(['GET', 'POST'], '/api/auth/*', (c) => adapters.auth.handle(c.req.raw));

  // oRPC reads a whole multipart body before the procedure runs, so a body far over the limit is
  // stopped here, unread, and answered as the procedure's own defined error (spec #60).
  app.use(
    '/rpc/record/stones/place',
    bodyLimit({
      maxSize: maxWatchFileBytes + multipartHeadroom,
      onError: (c) => {
        const tooLarge = new ORPCError('TURNED_AWAY', { defined: true, status: 413, data: { reason: 'too-large' } });
        // oRPC's RPC wire format for an error, so the client sees the contract's TURNED_AWAY.
        return c.json({ json: tooLarge.toJSON() }, 413);
      },
    }),
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
