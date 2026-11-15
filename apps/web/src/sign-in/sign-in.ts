// The only module in the web app that talks to Better Auth. Better Auth speaks of
// "users"; everything outside this file speaks of persons (ADR 0006). Who is signed
// in comes from `shared.persons.me`, never from Better Auth's session.
import { createAuthClient } from 'better-auth/client';

// Better Auth is served on the web app's own origin (Vite proxies /api/auth to the API),
// so the session cookie is same-site.
const betterAuth = createAuthClient({ baseURL: window.location.origin });

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

/** Anything else went wrong: Varða couldn't be reached, or it failed. */
export class SignInServiceFailed extends Error {
  constructor(detail: string) {
    super(`Signing in, up or out failed: ${detail}`);
    this.name = 'SignInServiceFailed';
  }
}

type BetterAuthError = { code?: string | undefined; message?: string | undefined; status: number };

// Better Auth's error codes are an open set of strings, so anything unknown is a service failure.
const emailAlreadySignedUpCodes = new Set(['USER_ALREADY_EXISTS', 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL']);

function failure(error: BetterAuthError): Error {
  if (error.code && emailAlreadySignedUpCodes.has(error.code)) return new EmailAlreadySignedUp();
  if (error.code === 'INVALID_EMAIL_OR_PASSWORD') return new EmailAndPasswordDontMatch();
  return new SignInServiceFailed(`${error.status} ${error.code ?? error.message ?? ''}`.trim());
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
