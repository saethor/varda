import { ORPCError } from '@orpc/client';
import type { QueryClient } from '@tanstack/react-query';
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

/** Drops the cached person after signing in, up or out, so the next page asks again. */
export function forgetWhoIsSignedIn(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: orpc.shared.persons.me.key() });
}
