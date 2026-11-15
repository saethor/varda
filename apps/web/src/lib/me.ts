import { ORPCError } from '@orpc/client';
import type { QueryClient } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import { orpc } from './orpc.ts';

/** Who is signed in. Success means a signed-in person; `UNAUTHORIZED` means nobody. */
export const meQuery = orpc.shared.persons.me.queryOptions();

/** The signed-in person, or `null` when nobody is signed in. Any other failure is thrown. */
export async function signedInPerson(queryClient: QueryClient) {
  try {
    return await queryClient.ensureQueryData(meQuery);
  } catch (error) {
    if (error instanceof ORPCError && error.code === 'UNAUTHORIZED') return null;
    throw error;
  }
}

/**
 * Drops the whole query cache after signing in, up or out: who is signed in, and
 * everything that belonged to them (their passkeys), so the next page asks again.
 */
export function forgetEverythingCached(queryClient: QueryClient) {
  queryClient.removeQueries();
}

/** A `beforeLoad` for sign-in and sign-up: a person who is already signed in goes home. */
export async function sendSignedInPersonHome({ context }: { context: { queryClient: QueryClient } }) {
  if (await signedInPerson(context.queryClient)) throw redirect({ to: '/' });
}
