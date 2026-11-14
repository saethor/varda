# The API is composed from injected adapters; fakes live with their context

`apps/api` builds the whole application with `createApp(adapters)`, the only place where contexts are wired to adapters. Its input has one group per context, each typed by that context's own list of ports, plus the cross-cutting adapters `auth` (request → person or nobody), `clock` and `ids`. `main.ts` is the only code that reads the environment and opens connections; it builds the real adapters with a factory exported from each context's `index.ts`. Tests build the same app with in-memory fakes. We chose this so that ADR 0007 holds by construction: the first repository can't pull Postgres into the default suite, and no test needs module mocking.

## Consequences

- Each context ships its in-memory fakes from a `./testing` subpath, used only by test files (checked by dependency-cruiser). Every port with a real adapter has one behaviour suite, also exported from `./testing`, that runs against the fake in `pnpm test` and against Postgres in `pnpm test:adapters`, so a fake can't quietly drift from the real adapter.
- API tests use `createTestApp({ as, overrides })`, which returns the typed oRPC client and the fakes. Assertions go through the client only; setup goes through the client too, and fakes are seeded directly only for state the contract can't create (e.g. a recording that arrived by sync).
- Each context's adapters include a `transaction(work)` that gives `work` transaction-scoped repositories and the job queue, so a change and the job it causes commit together (ADR 0006). **A transaction never spans two contexts**: they share no foreign keys and refer to each other by identity only (ADR 0005), so a use case that touches both contexts must tolerate one side committing without the other.
- Adapter groups are added when a context gets its first port, not stubbed upfront. A separate `compose(adapters)` for the worker is pulled out of `createApp` only once the worker exists.
