// A person is someone who uses Varða (Shared glossary). They sign in with
// exactly one login account, which is not part of the domain: the person
// refers to it by identity only, and never holds its email address.
export type PersonId = string;
export type LoginAccountId = string;

export type Person = { id: PersonId; name: string };

/** What a login account tells Varða about the person signing in. */
export type LoginAccount = { id: LoginAccountId; name: string };
