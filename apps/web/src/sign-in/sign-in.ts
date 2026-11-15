// The only module in the web app that talks to Better Auth. Better Auth speaks of
// "users", and calls the password sign-in method "email"; everything outside this file
// speaks of persons, sign-in methods, passwords and passkeys (ADR 0006). Who is signed
// in comes from `shared.persons.me`, never from Better Auth's session.
import { passkeyClient } from '@better-auth/passkey/client';
import { createAuthClient } from 'better-auth/client';
import { lastLoginMethodClient } from 'better-auth/client/plugins';
import { thisBrowserAndOperatingSystem } from './device-name.ts';

// Better Auth is served on the web app's own origin (Vite proxies /api/auth to the API),
// so the session cookie is same-site.
const betterAuth = createAuthClient({
  baseURL: window.location.origin,
  plugins: [passkeyClient(), lastLoginMethodClient()],
});

/** Sign-up failed because a person has already signed up with this email. */
export class EmailAlreadySignedUp extends Error {
  constructor() {
    super('This email is already signed up.');
    this.name = 'EmailAlreadySignedUp';
  }
}

/** Sign-in failed because the email and password don't match, whichever of them is wrong. */
export class EmailAndPasswordDontMatch extends Error {
  constructor() {
    super("That email and password don't match.");
    this.name = 'EmailAndPasswordDontMatch';
  }
}

/** Sign-in failed because Varða doesn't know the passkey the person picked, say because it was removed. */
export class PasskeyNotRecognised extends Error {
  constructor() {
    super("Varða doesn't recognise that passkey.");
    this.name = 'PasskeyNotRecognised';
  }
}

/** Signing in, up or out failed for any other reason: Varða couldn't be reached, or it failed. */
export class LoginServiceFailed extends Error {
  constructor(detail: string) {
    super(`Signing in, up or out failed: ${detail}`);
    this.name = 'LoginServiceFailed';
  }
}

type BetterAuthError = { code?: string | undefined; message?: string | undefined; status: number };

// Better Auth's error codes are an open set of strings, so anything unknown is a service failure.
const emailAlreadySignedUpCodes = new Set(['USER_ALREADY_EXISTS', 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL']);

function failure(error: BetterAuthError): Error {
  if (error.code && emailAlreadySignedUpCodes.has(error.code)) return new EmailAlreadySignedUp();
  if (error.code === 'INVALID_EMAIL_OR_PASSWORD') return new EmailAndPasswordDontMatch();
  if (error.code === 'PASSKEY_NOT_FOUND') return new PasskeyNotRecognised();
  return new LoginServiceFailed(`${error.status} ${error.code ?? error.message ?? ''}`.trim());
}

/** Signs a new person up and signs them in straight away. */
export async function signUp({ name, email, password }: { name: string; email: string; password: string }) {
  const { error } = await betterAuth.signUp.email({ name, email, password });
  if (error) throw failure(error);
}

/** Signs a person in with their email and password. */
export async function signIn({ email, password }: { email: string; password: string }) {
  const { error } = await betterAuth.signIn.email({ email, password });
  if (error) throw failure(error);
}

/** Signs the person out on this device. */
export async function signOut() {
  const { error } = await betterAuth.signOut();
  if (error) throw failure(error);
}

// Passkeys

/**
 * How a passkey prompt ended, when it didn't fail. `closed` means the person closed or
 * cancelled the browser's prompt (or another prompt replaced it): not an error, and the
 * screen stays as it was.
 */
export type PasskeyOutcome = 'done' | 'closed';

// The browser's passkey prompt was closed or cancelled, or aborted because another prompt
// replaced it. Closing it surfaces as NotAllowedError (ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY),
// which WebAuthn deliberately also raises when the prompt times out or the device refuses,
// so a site can't tell whether a passkey exists. All of them read as "closed".
const promptClosedCodes = new Set(['ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY', 'ERROR_CEREMONY_ABORTED']);

function passkeyOutcome(error: BetterAuthError | null): PasskeyOutcome {
  if (!error) return 'done';
  if (error.code && promptClosedCodes.has(error.code)) return 'closed';
  throw failure(error);
}

/** Whether this browser can use passkeys at all. Passkey actions are hidden when it can't. */
export function browserSupportsPasskeys(): boolean {
  return typeof window.PublicKeyCredential === 'function';
}

/** Signs a person in with a passkey they pick from the browser's passkey prompt. */
export async function signInWithPasskey(): Promise<PasskeyOutcome> {
  const { error } = await betterAuth.signIn.passkey();
  return passkeyOutcome(error);
}

/**
 * Offers the person's passkeys in the browser's autofill on the email field, which must
 * have `autocomplete="email webauthn"` (conditional mediation). `whenPicked` is called
 * once the person picks one and Varða starts checking it. Settles once that signs them in
 * (`done`) or the offer is replaced by another passkey prompt (`closed`). In a browser
 * without passkey autofill it settles straight away as `closed`.
 */
export async function offerPasskeysInAutofill(whenPicked: () => void): Promise<PasskeyOutcome> {
  if (!(await window.PublicKeyCredential?.isConditionalMediationAvailable?.())) return 'closed';
  let picked = false;
  const { error } = await betterAuth.signIn.passkey({
    autoFill: true,
    // Better Auth sends these fetch options only with the request that verifies the
    // passkey the browser handed over, so this runs once the person has picked one.
    fetchOptions: {
      onRequest: () => {
        picked = true;
        whenPicked();
      },
    },
  });
  return autofillOutcome(error, picked);
}

function autofillOutcome(error: BetterAuthError | null, picked: boolean): PasskeyOutcome {
  if (error?.code === 'AUTH_CANCELLED') {
    // AUTH_CANCELLED is Better Auth's word for two different things. Before the person
    // picked a passkey, it is a browser error it can't place, such as a browser that claims
    // passkey autofill but has no authenticator to offer (NotSupportedError): the person
    // asked for nothing, so an offer the browser couldn't make is not a failure. After they
    // picked one, it means the request verifying it threw: Varða couldn't be reached.
    if (picked) throw new LoginServiceFailed('the passkey picked from autofill could not be verified');
    return 'closed';
  }
  return passkeyOutcome(error);
}

/** Adds a passkey to the signed-in person's login account, named after this browser and operating system. */
export async function addPasskey(): Promise<PasskeyOutcome> {
  const { error } = await betterAuth.passkey.addPasskey({ name: thisBrowserAndOperatingSystem() });
  return passkeyOutcome(error);
}

/** A passkey on the signed-in person's login account. */
export type Passkey = { id: string; name: string | null; addedAt: Date };

/** The passkeys on the signed-in person's login account, oldest first. */
export async function listPasskeys(): Promise<Passkey[]> {
  const { data, error } = await betterAuth.passkey.listUserPasskeys();
  if (error) throw failure(error);
  return data
    .map(({ id, name, createdAt }) => ({ id, name: name ?? null, addedAt: new Date(createdAt) }))
    .sort((a, b) => a.addedAt.getTime() - b.addedAt.getTime());
}

/** Removes a passkey from the signed-in person's login account, so it can no longer sign them in. */
export async function removePasskey(id: string): Promise<void> {
  const { error } = await betterAuth.passkey.deletePasskey({ id });
  if (error) throw failure(error);
}

/** A way into a login account (the glossary's sign-in method). */
export type SignInMethod = 'password' | 'passkey';

/** How the person last signed in on this browser, or `null` if they never have. */
export function lastSignInMethod(): SignInMethod | null {
  const method = betterAuth.getLastUsedLoginMethod();
  if (method === 'email') return 'password';
  if (method === 'passkey') return 'passkey';
  return null;
}
