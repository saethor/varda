import type { RecordAdapters } from '@varda/record';
import type { SharedAdapters, SharedContext } from '@varda/shared';

/** Login: who is asking, and the HTTP endpoints for signing up, in and out. */
export type Auth = {
  /** The ID of the signed-in person behind a request, or nobody (null). */
  personFor(request: Request): Promise<SharedContext['person']>;
  /** Answers a request to the login endpoints under /api/auth. */
  handle(request: Request): Promise<Response>;
};

// Everything the application needs from the outside world (ADR 0008).
// One group per context, typed by that context's own ports, plus the
// cross-cutting `auth` adapter. The cross-cutting `ids` (and `clock`, when
// first needed) sit inside each context's group, which uses them.
// main.ts passes the real adapters, tests pass in-memory fakes.
export type AppAdapters = {
  shared: SharedAdapters;
  record: RecordAdapters;
  auth: Auth;
};
