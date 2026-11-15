// The dev menu's endpoints: switch the browser to any person, with no password, in local
// development only. Registered only when VARDA_DEV_MENU=true (main.ts); otherwise these
// routes don't exist. Not Better Auth's admin plugin, which needs a signed-in admin.
import type { SharedReaders } from '@varda/shared';
import type { BetterAuthPlugin } from 'better-auth';
import { APIError, createAuthEndpoint } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import { z } from 'zod';

export function devMenu(persons: SharedReaders['persons']) {
  return {
    id: 'varda-dev-menu',
    endpoints: {
      /** GET /api/auth/dev/persons: every person as `{ id, name }`, sorted by name. */
      devMenuPersons: createAuthEndpoint('/dev/persons', { method: 'GET' }, async (ctx) =>
        ctx.json(await persons.everyone()),
      ),
      /**
       * POST /api/auth/dev/impersonate with `{ personId }`: signs in as that person with an
       * ordinary session and the usual cookie, so `personFor` sees a normal sign-in.
       */
      devMenuImpersonate: createAuthEndpoint(
        '/dev/impersonate',
        { method: 'POST', body: z.object({ personId: z.string() }) },
        async (ctx) => {
          const { personId } = ctx.body;
          // An ID that isn't a UUID is no person's either: 404, not 400 (and never a query the database rejects).
          const loginAccount = z.uuid().safeParse(personId).success ? await persons.loginAccountOf(personId) : null;
          const user = loginAccount && (await ctx.context.internalAdapter.findUserById(loginAccount));
          if (!user) throw new APIError('NOT_FOUND', { message: `No person ${personId}.` });
          const session = await ctx.context.internalAdapter.createSession(user.id);
          await setSessionCookie(ctx, { session, user });
          return ctx.json({ personId });
        },
      ),
    },
  } satisfies BetterAuthPlugin;
}
