import { implement, ORPCError } from '@orpc/server';
import type { SharedAdapters } from '../application/shared-adapters.ts';
import { sharedContract } from '../contract.ts';
import type { PersonId } from '../domain/person.ts';
import { sportGroupOf, sports } from '../domain/sport.ts';

/**
 * The per-request context every context's procedures start from (ADR 0006):
 * the signed-in person's ID, never the login account's, or nobody. apps/api
 * fills it from the `auth` adapter.
 */
export type SharedContext = { person: PersonId | null };

const os = implement(sharedContract).$context<SharedContext>();

/**
 * Requires a signed-in person and hands procedures their ID. Fails with the
 * `UNAUTHORIZED` error every procedure built on `signedInProcedure` declares.
 */
const requirePerson = os.middleware(async ({ context, next }) => {
  if (context.person === null) {
    throw new ORPCError('UNAUTHORIZED');
  }
  return await next({ context: { person: context.person } });
});

// The Shared context's part of the API contract (ADR 0006).
export function createSharedRouter(adapters: SharedAdapters) {
  return os.router({
    sports: {
      list: os.sports.list.handler(() => sports.map((sport) => ({ sport, group: sportGroupOf(sport) }))),
    },
    persons: {
      me: os.persons.me.use(requirePerson).handler(async ({ context }) => {
        const person = await adapters.persons.byId(context.person);
        // The auth adapter only signs in persons that exist, and persons are never deleted.
        if (person === null) throw new Error(`The signed-in person ${context.person} does not exist.`);
        return person;
      }),
    },
  });
}
