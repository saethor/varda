// Everything the application needs from the outside world (ADR 0008).
// One group per context, typed by that context's own ports, plus the
// cross-cutting adapters (auth, clock, ids). Each is added when a feature first
// needs it; main.ts passes the real adapters, tests pass in-memory fakes.
export type AppAdapters = Record<never, never>;
