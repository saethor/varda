import { RPCHandler } from '@orpc/server/fetch';
import { Hono } from 'hono';
import { router } from './router.ts';

const rpc = new RPCHandler(router);

export const app = new Hono();

app.get('/health', (c) => c.json({ ok: true }));

app.use('/rpc/*', async (c, next) => {
  const { matched, response } = await rpc.handle(c.req.raw, { prefix: '/rpc', context: {} });
  if (matched) {
    return c.newResponse(response.body, response);
  }
  await next();
});
