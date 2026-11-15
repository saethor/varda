/**
 * What happened on the sign-in screen, as far as deciding which failure it shows.
 *
 * - `signInStarted`: the person submitted their email and password, or pressed "Sign in with a passkey".
 * - `signInFailed`: that sign-in failed.
 * - `autofillOffered`: the browser's autofill was asked to offer the person's passkeys.
 * - `passkeyPickedFromAutofill`: the person picked one of them, which signs them in.
 * - `autofillFailed`: the offer, or signing in with the passkey picked from it, failed.
 */
export type SignInEvent =
  | { type: 'signInStarted' }
  | { type: 'signInFailed'; error: Error }
  | { type: 'autofillOffered' }
  | { type: 'passkeyPickedFromAutofill' }
  | { type: 'autofillFailed'; error: Error };

/** The failure the sign-in screen shows (`null` for none), and whether the person has picked a passkey from the current autofill offer. */
export type SignInFailure = { shown: Error | null; pickedFromAutofill: boolean };

export const nothingFailed: SignInFailure = { shown: null, pickedFromAutofill: false };

/**
 * Decides which failure the sign-in screen shows: the latest failure of something the
 * person asked for. The autofill offer is made on its own, as the screen opens and again
 * after the passkey button's prompt, so its failure counts only once the person has picked
 * a passkey from it.
 */
export function signInFailure(state: SignInFailure, event: SignInEvent): SignInFailure {
  switch (event.type) {
    case 'signInStarted':
      return nothingFailed;
    case 'signInFailed':
      return { ...state, shown: event.error };
    case 'autofillOffered':
      return { ...state, pickedFromAutofill: false };
    case 'passkeyPickedFromAutofill':
      return { shown: null, pickedFromAutofill: true };
    case 'autofillFailed':
      return state.pickedFromAutofill ? { ...state, shown: event.error } : state;
  }
}
