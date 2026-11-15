import { ORPCError } from '@orpc/client';
import type { QueryClient } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import { orpc } from './orpc.ts';

/** Who is signed in. Success means a signed-in person; `UNAUTHORIZED` means nobody. */
export const meQuery = orpc.shared.persons.me.queryOptions();

/** The signed-in person, or `null` when nobody is signed in. Any other failure is thrown. */
export async function signedInPerson(queryClient: QueryClient) {
  try {
    // Cached until invalidated, e.g. by the dev menu switching persons; then asked again.
    return await queryClient.fetchQuery({ ...meQuery, staleTime: Number.POSITIVE_INFINITY });
  } catch (error) {
    if (error instanceof ORPCError && error.code === 'UNAUTHORIZED') return null;
    throw error;
  }
}

/** Drops the cached person after signing in, up or out, so the next page asks again. */
export function forgetWhoIsSignedIn(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: orpc.shared.persons.me.key() });
}

/** A `beforeLoad` for sign-in and sign-up: a person who is already signed in goes home. */
export async function sendSignedInPersonHome({ context }: { context: { queryClient: QueryClient } }) {
  if (await signedInPerson(context.queryClient)) throw redirect({ to: '/' });
}
