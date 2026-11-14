import { implement, ORPCError } from '@orpc/server';
import type { SharedAdapters } from '../application/shared-adapters.ts';
import { sharedContract } from '../contract.ts';
import type { Person } from '../domain/person.ts';
import { sportGroupOf, sports } from '../domain/sport.ts';

/**
 * The per-request context every context's procedures start from (ADR 0006):
 * the signed-in person, or nobody. apps/api fills it from the `auth` adapter.
 */
export type SharedContext = { person: Person | null };

const os = implement(sharedContract).$context<SharedContext>();

/**
 * Requires a signed-in person and hands procedures that person, never the login
 * account. Fails with the `UNAUTHORIZED` error the procedure declares by
 * building on `requiresPerson` in the contract.
 */
export const requirePerson = os.middleware(async ({ context, next }) => {
  if (context.person === null) {
    throw new ORPCError('UNAUTHORIZED');
  }
  return await next({ context: { person: context.person } });
});

// The Shared context's part of the API contract (ADR 0006).
export function createSharedRouter(_adapters: SharedAdapters) {
  return os.router({
    sports: {
      list: os.sports.list.handler(() => sports.map((sport) => ({ sport, group: sportGroupOf(sport) }))),
    },
    persons: {
      me: os.persons.me.use(requirePerson).handler(({ context }) => context.person),
    },
  });
}
