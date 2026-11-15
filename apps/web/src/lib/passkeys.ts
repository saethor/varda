import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { addPasskey, listPasskeys, removePasskey } from '../sign-in/sign-in.ts';

/** The passkeys on the signed-in person's login account. The hooks below refresh it after adding or removing one. */
export const passkeysQuery = queryOptions({
  // Passkeys come from Better Auth, not from Varða's oRPC contract, so there is no
  // oRPC-made key for them; this one is ours.
  queryKey: ['passkeys'],
  queryFn: listPasskeys,
});

/**
 * Adds a passkey to the signed-in person's login account. `whenAdded` runs once the list
 * of passkeys has been refreshed, or is `null` when the screen has nothing more to do.
 * Closing the browser's prompt adds nothing and runs nothing.
 */
export function useAddPasskey(whenAdded: (() => Promise<void>) | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addPasskey,
    onSuccess: async (outcome) => {
      switch (outcome) {
        case 'done':
          await queryClient.invalidateQueries(passkeysQuery);
          await whenAdded?.();
          return;
        case 'closed':
          return;
      }
    },
  });
}

/** Removes the passkey with this id from the signed-in person's login account. */
export function usePasskeyRemoval(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => await removePasskey(id),
    onSuccess: async () => await queryClient.invalidateQueries(passkeysQuery),
  });
}
