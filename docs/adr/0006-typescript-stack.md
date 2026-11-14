# TypeScript end to end: Hono + oRPC, Drizzle on Postgres, and a Vite SPA

The whole system is TypeScript on Node.js LTS, in a pnpm + Turborepo monorepo. The web app is a React single-page app built with Vite, using TanStack Router and TanStack Query. The API (`apps/api`) is Hono, serving **oRPC procedures defined contract-first**: each context package exports its oRPC contract and Zod schemas from a `contract` subpath and implements that contract itself, `apps/api` only combines the contexts' implementations, and `apps/web` may import only the contracts, never server code. Data lives in PostgreSQL through Drizzle, with one schema per context (ADR 0005) plus an `auth` schema; background work runs on pg-boss in the same database; login is self-hosted with Better Auth. Everything is hosted in the EU. We chose one language so the compiler is the contract between web and API, and Postgres-backed jobs and auth so there is one database to run and back up, and so health data stays in our own database in the EU.

## Considered Options

- **Python (or another language) for the backend.** Stronger for analysis, but two languages and a generated API boundary. Garmin's FIT SDK exists for JavaScript, and training-load and best-effort maths are fine in TypeScript.
- **REST + OpenAPI.** Familiar, but means maintaining a spec and generating a client. oRPC can still serve chosen procedures as REST and generate OpenAPI, which is also the escape route if oRPC is ever abandoned.
- **tRPC.** More mature, but the web app would import the server's router type, so there is no separate contract the boundary rules can enforce. oRPC is younger and has a smaller maintainer base; we accepted that risk.
- **Next.js or React Router v7 framework mode.** Everything sits behind a login, so server rendering buys little. Next.js pulls the backend into the frontend. React Router has untyped search params and loaders that compete with TanStack Query's cache. TanStack Router won on typed, validated search params (calendar weeks, chart ranges, filters in the URL) and a single cache shared with TanStack Query and oRPC.
- **Prisma or Kysely.** Prisma's single schema file sits badly with per-context schemas owned by packages; Kysely needs hand-written migrations.
- **A hosted auth provider (Clerk, Auth0).** Login accounts would live with a vendor, outside the EU database, and cost per user.
- **BullMQ + Redis.** More capable, but another service to run; pg-boss can queue a job in the same transaction as the change that caused it.
- **Serverless.** pg-boss needs a long-running worker and Postgres needs pooling from short-lived functions. The API and worker run as containers on an EU platform; the web app is static files on a CDN. Hono keeps a later move open.
- **Effect** (`Effect<A, E, R>` with Layers, tagged errors and Schema). Its main gains are dependency injection and typed errors: ADR 0008's injected adapters already give the first in plain TypeScript, and thrown domain errors mapped to oRPC typed errors already give the web app typed failures. In exchange it colours every function that does I/O, needs every promise-based library (Hono, oRPC, Drizzle, Better Auth, pg-boss) wrapped, and needs its own guard tooling against dropped effects and untagged errors.

## Consequences

- **Each context implements its own part of the contract**, in `src/adapters/rpc` (a driving adapter, the only layer allowed `@orpc/server`). A context's `index.ts` exports only its router factory `createXRouter(adapters)`, its real-adapter factory `createXAdapters(infra)`, the `XAdapters` type, and readers it offers to other contexts. Use cases are not exported. We chose this over implementing everything in `apps/api` so that the contract and its handlers change together, and so apps/api doesn't grow per-procedure glue and domain mapping (the gateway problem ADR 0005 rejected).
- Handlers call `application/` use cases. They may call `domain/` directly only when no ports are involved (e.g. listing sports); a use case that only reshapes domain data is a pass-through and shouldn't exist.
- Procedures declare their expected failures as oRPC typed errors in the contract. Use cases throw domain errors (`Error` subclasses named in the domain's words), and `adapters/rpc` translates each to its typed error and anything else to a 500, so domain code never imports oRPC and the web app gets typed failures.
- Shared owns the per-request context (the signed-in person) and the middleware that requires one, so all three contexts implement their contracts on the same base.
- The login account (Better Auth's "user") stays outside the domain; the Shared context maps it to a **person**. "User" appears only inside the auth adapter.
- Each context package owns its Drizzle schema and its own migrations folder; one command runs them all.
- IDs are UUIDv7, generated in application code: references across schemas are identity-only, so IDs must be globally unique.
- Garmin is an integration package (`@varda/garmin`) with no domain logic. Record uses it to place stones and Plan uses it to send workouts to the watch, mapping Garmin's "activity" to stone at the boundary (ADR 0001).
