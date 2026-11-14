import type { Ids, Person, SharedAdapters } from '@varda/shared';

/** Login: who is asking, and the HTTP endpoints for signing up, in and out. */
export type Auth = {
  /** The signed-in person behind a request, or nobody (null). */
  personFor(request: Request): Promise<Person | null>;
  /** Answers a request to the login endpoints under /api/auth. */
  handle(request: Request): Promise<Response>;
};

// Everything the application needs from the outside world (ADR 0008).
// One group per context, typed by that context's own ports, plus the
// cross-cutting adapters (auth, ids; clock when first needed). main.ts passes
// the real adapters, tests pass in-memory fakes.
export type AppAdapters = {
  shared: Omit<SharedAdapters, 'ids'>;
  auth: Auth;
  ids: Ids;
};
