import type { Auth } from './adapters.ts';

/** The persons a fresh local database gets, on the reserved `varda.test` domain. */
const devPersons = [
  { name: 'Anna Jónsdóttir', email: 'anna@varda.test' },
  { name: 'Bjarni Sigurðsson', email: 'bjarni@varda.test' },
  { name: 'Guðrún Ólafsdóttir', email: 'gudrun@varda.test' },
  { name: 'Kári Einarsson', email: 'kari@varda.test' },
  { name: 'Sóley Magnúsdóttir', email: 'soley@varda.test' },
];

export type SeedResult = {
  /** Emails of the login accounts this run signed up. */
  created: string[];
  /** Emails that already had a login account, left as they were. */
  skipped: string[];
};

/**
 * Signs up the dev persons through the normal sign-up endpoint, so each person is
 * created exactly like a real one. Emails that already have a login account are
 * skipped, so running it again adds nothing.
 */
export async function seedPersons({
  auth,
  baseURL,
  password,
}: {
  auth: Auth;
  /** The origin the auth adapter was built with (BETTER_AUTH_URL). */
  baseURL: string;
  /** The one dev password every seeded login account gets. */
  password: string;
}): Promise<SeedResult> {
  const result: SeedResult = { created: [], skipped: [] };
  for (const { name, email } of devPersons) {
    const response = await auth.handle(
      new Request(new URL('/api/auth/sign-up/email', baseURL), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      }),
    );
    if (response.ok) {
      result.created.push(email);
    } else if (response.status === 422) {
      // Better Auth's answer when the email already has a login account.
      result.skipped.push(email);
    } else {
      throw new Error(`Signing up ${email} failed: ${response.status} ${await response.text()}`);
    }
  }
  return result;
}
