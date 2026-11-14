import type { Ids, Person, SharedAdapters } from '@varda/shared';

/** Who is asking: the signed-in person behind a request, or nobody (null). */
export type Auth = {
  personFor(request: Request): Promise<Person | null>;
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
