# Coding standards

The rules a human or an agent holds in their head while writing and reviewing
code here. Each rule's essence is here; the longer reasoning lives in the ADR
or doc it links. Every rule says what enforces it, or "Review only" when nothing
mechanical can. A mechanical rule is an error from the first commit: there are
no allowlists or ratchets.

## Vocabulary

### Code speaks the glossary

Code, the contract, the database and tests use the canonical themed English
terms from the context's `GLOSSARY.md` ([`GLOSSARY-MAP.md`](./GLOSSARY-MAP.md),
[ADR 0001](./docs/adr/0001-themed-english-as-canonical-vocabulary.md)). A stone
is never an "activity", even where Garmin says so: map it at the integration
boundary. A "workout" is always planned, never done. The signed-in human is a
**person**; "user" appears only inside the auth adapter. Packages and code are
named after contexts (`plan`, `record`, `shared`), never after product areas
(Splitsmith, Varða). A concept the glossary lacks gets its term there first,
then in code.

Review only.

## Architecture

The boundaries decided in ADRs [0004](./docs/adr/0004-plan-and-record-as-separate-contexts.md),
[0005](./docs/adr/0005-modular-monolith-with-a-schema-per-context.md),
[0006](./docs/adr/0006-typescript-stack.md) and
[0008](./docs/adr/0008-the-api-is-composed-from-injected-adapters.md), in one
line each:

- **Layers point inwards**: `domain` ← `application` ← `adapters`. Enforced by
  dependency-cruiser (`domain-is-innermost`, `application-does-not-import-adapters`).
- **Only adapters do I/O**: no database, HTTP, storage, Garmin or Node built-in
  in `domain` or `application`. Enforced by dependency-cruiser
  (`no-io-packages-in-domain-or-application`, `no-node-builtins-in-domain-or-application`).
- **Plan and Record never import each other; each imports only `shared`.**
  Enforced by dependency-cruiser (`context-imports-only-shared`, `shared-imports-no-context`).
- **One context reads another through published readers**: the read context
  exports a neutral read model from `index.ts`; the reading context defines
  narrow ports named after its own questions and maps the model in its own
  adapter; `apps/api` only connects them. Review only.
- **`apps/web` imports only contracts and `@varda/ui`**, never server code, not
  even types. Enforced by dependency-cruiser (`web-imports-only-contracts-and-ui`).
- **The contract is implemented in `adapters/rpc`**, the only layer that imports
  `@orpc/server`. A context's `index.ts` exports only its router factory, its
  adapter factory, its `XAdapters` type and its published readers. Enforced by
  dependency-cruiser for `domain` and `application`; review for the rest.
- **Fakes and `createTestApp` are for tests only.** Enforced by
  dependency-cruiser (`testing-code-only-in-tests`).

## Configuration and data

### Only `main.ts` reads the environment

`apps/api/src/main.ts` (and later the worker's entry point) is the only code
that reads `process.env` and opens connections
([ADR 0008](./docs/adr/0008-the-api-is-composed-from-injected-adapters.md)). It
reads every variable the process needs at startup and stops, naming the
variable, if one is missing, before any work starts. Everything else receives
configuration and connections through its adapters.

Review only.

### A context reads only its own schema

Each context owns its PostgreSQL schema. No context reads or writes another's
tables, and there are no foreign keys between schemas: a cross-context
reference is an identity, and the reader must handle "not found"
([ADR 0005](./docs/adr/0005-modular-monolith-with-a-schema-per-context.md)).

Review only.

### Transactions stay inside one context

A use case that changes state and causes background work enqueues the job
inside the same `transaction(work)` as the change, so both commit or neither
does ([ADR 0006](./docs/adr/0006-typescript-stack.md)). A transaction never
spans two contexts: a use case touching both must tolerate one side committing
without the other
([ADR 0008](./docs/adr/0008-the-api-is-composed-from-injected-adapters.md)).

Review only.

### Time and IDs come from ports

`domain` and `application` code never call `new Date()`, `Date.now()`,
`crypto.randomUUID()` or `Math.random()`. Time comes from the `clock` adapter
and IDs (UUIDv7, generated in application code) from the `ids` adapter, so a
test controls both without faking timers.

Enforced by dependency-cruiser for `crypto` (a Node built-in); review for `Date`
and `Math.random`.

## Recordings

### A recording is never written to

The **recording** of a stone (the original watch file or synced data) is kept
untouched forever. A fix to a stone's distance, pace or laps is a
**correction** layered on top, and can be reverted. Every derived value
(training load, best efforts, the Breakdown) is calculated from the recording
with its corrections applied, never from the raw recording alone, and never by
overwriting it. "Just update the distance" is the bug this rule exists for
([ADR 0002](./docs/adr/0002-recordings-are-immutable-corrections-are-layered.md)).

Review only.

## Control flow

### A switch over a union names every member

A `switch` on a union type lists every member as its own `case`, even the ones
that share a branch. A `default` that quietly absorbs the leftover members also
absorbs the member someone adds next month, and that new member takes the
fallback branch without anyone deciding it should: a new sport would silently
get another sport's zones. With every case named, adding a member fails the
lint until each switch says what to do with it.

Enforced by Biome (`useExhaustiveSwitchCases` with `requireExplicitCase`).

### Functions stay simple

No function has a cognitive complexity over 15. Over the limit, split it:
extract named helpers, or move the decision into a reducer.

Enforced by Biome (`noExcessiveCognitiveComplexity`).

### Lint suppressions give a reason

A `biome-ignore` comment says why the rule is wrong here. It is never used for
`noExcessiveCognitiveComplexity` (split the function) or `noExplicitAny` (cast
once at the boundary into a named type).

Enforced by Biome (a suppression needs a reason); review for which rules.

## Errors

### Domain errors are thrown, and translated at the edge

A use case signals an expected failure by throwing a domain error: a subclass
of `Error` named in the domain's words (`StoneNotFound`, `NotYourStone`), never
a string, a plain object or an oRPC error. `adapters/rpc` maps each domain
error to the typed error the procedure declares in its contract, so domain code
never imports oRPC and the web app gets typed failures; anything it does not
recognise becomes a 500 ([ADR 0006](./docs/adr/0006-typescript-stack.md)). A
new domain error a procedure can raise is added to that procedure's contract.

Enforced by Biome (`useThrowOnlyError`); review for the rest.

### Every promise is awaited, handled or marked void

A promise nobody awaits loses its rejection: the failure turns into an
unhandled rejection rather than an error the caller sees, and the work it
started may still be running after the caller has moved on. Await it, or
`.catch` it where it is made. When fire-and-forget really is the intent (a
signal handler, a best-effort log line), write `void promise` with a comment
saying why nothing waits on it. Do not hand an async function to a slot that
expects a `void` callback either (an event listener, `forEach`), because
nothing there awaits or catches what it returns.

Enforced by Biome (`noFloatingPromises`, `noMisusedPromises`).

## Function signatures

Optional parameters and properties are scrutinised extremely carefully. They are
a huge source of bugs by omission: a caller that forgets one compiles and does
the wrong thing. Prefer a required parameter, or a union that makes the caller
choose. Prioritise correctness over backwards compatibility.
`exactOptionalPropertyTypes` is on, so `undefined` is never a stand-in for
"absent".

Review only.

## Types

### Every `any` is a leak

An `any` switches the type checker off for every value that flows through it.
Write the type you mean: a known shape gets a named type; an unknown one gets
`unknown` and is narrowed (or parsed with Zod); one that varies by caller gets a
generic **constrained** to the real thing (`<A extends RecordAdapters>`, not
`<A>`).

An `any` is acceptable only when a third-party type is genuinely `any` at the
boundary: cast once in the adapter into a named type and keep it out of
exported signatures.

Enforced by Biome (`noExplicitAny`).

## Front end

### Server data lives in TanStack Query

Data from the API is read only through oRPC's TanStack Query utilities, never
copied into `useState`. Optimistic UI comes from the mutation's `variables` (or
`onMutate` and the cache), and falls back to the query's data when the mutation
settles. When a mutation's last job is to navigate, navigate in its
`onSuccess`, never from a `useEffect` watching its result: an effect re-fires
whenever a dependency changes and re-issues the navigation.

Review only.

### Shareable state lives in the URL

Anything a person could bookmark or send (the selected week, a chart's range,
filters) is a search param validated by the route's `validateSearch` (Zod), not
`useState`. Typed search params are why we chose TanStack Router
([ADR 0006](./docs/adr/0006-typescript-stack.md)).

Review only.

### Decisions live in reducers

Client-only state with real logic (editing a workout's steps, a multi-step
form) lives in one pure reducer per surface: events are facts (what happened),
and tests drive the reducer with event sequences instead of rendering. A plain
toggle may use `useState`. A `useEffect` never makes a decision; it only
synchronises with something outside React.

Review only.

### Filters stay in sync with the entity

When an entity gains a field that changes what it "is" (a new workout outcome,
a new sport, a stone excluded from best efforts), every filter, count and badge
that surfaces that concept takes it into account in the same change. Filters
are part of the entity's definition, not a one-time UI feature; drift between
them and the data shape produces silently wrong numbers.

Review only.

## Units and display

### SI units inside, formatted only for display

Domain code, the contract and the database use metres, seconds, metres per
second, beats per minute and watts. Pace is derived from speed only when shown.
Every value shown to a person (a duration, a pace, a distance, an elevation)
goes through the one set of formatters in `@varda/ui`; no component hand-rolls
`% 60` and `padStart`.

Review only.

### No user-facing string literals in components

The UI ships in English and Icelandic
([ADR 0001](./docs/adr/0001-themed-english-as-canonical-vocabulary.md)). Every
string a person reads comes from the message catalogue, keyed by its English
text; a component never contains a user-facing literal. The library is chosen
with the first real screen.

Review only.

## Interface design

### Deep modules

Prefer deep modules: small interface, deep implementation. Avoid shallow
modules: large interfaces with many methods that just pass through to a thin
implementation. A use case that only reshapes domain data is a pass-through and
shouldn't exist. When designing, ask: can I reduce the number of methods? Can I
simplify the parameters? Can I hide more complexity inside?

### Design for testability

1. **Depend on ports, don't create them.** A use case receives its
   repositories, readers, clock and ids through the context's `XAdapters`;
   only `apps/api` wires real ones
   ([ADR 0008](./docs/adr/0008-the-api-is-composed-from-injected-adapters.md)).
2. **Name a port after its question**: one method per question with one return
   shape (`PlannedWorkouts.onDay`, not a generic `query()`), so its fake is
   trivial.
3. **Return results, don't produce side effects** where a value will do.

## Testing

Tests verify behaviour through public interfaces, not implementation details.
Code can change entirely; tests shouldn't break unless behaviour changed.

**Fake at ports.** Use the context's in-memory fakes from its `./testing`
subpath; every fake is held to its real adapter by a shared behaviour suite.
Never mock a module or your own code: `vi` (`vi.mock`, `vi.fn`, fake timers) is
not imported; a clock or an ID is a port. When something is hard to test
without mocking, redesign the interface. The default suite (`pnpm test`) never
touches the database, the network or the filesystem
([ADR 0007](./docs/adr/0007-default-tests-never-touch-the-database.md)).

Every test must be able to fail for a plausible real bug a user or caller would
see; if you can't name the bug, don't write it. For what earns a place, the
three suites, worked examples and TDD, read
[`TESTING_STANDARDS.md`](./docs/TESTING_STANDARDS.md).

Enforced by Biome (`noRestrictedImports` on `vi` from `vitest`) and
dependency-cruiser (`testing-code-only-in-tests`); review for the rest.
