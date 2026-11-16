# Testing standards

The worked examples behind the testing rules in
[`CODING_STANDARDS.md`](../CODING_STANDARDS.md). Read those first: behaviour
through public interfaces, and fakes at ports, never mocks. Everything here is
how they look in practice.

## What earns a test its place

The rule: a test must be able to fail for a plausible real bug in behaviour a
user or caller observes.

Worth a test: business rules (judging a workout outcome, training load, best
efforts); parsers and serialisers (FIT files, workouts sent to the watch); data
integrity, for example:

- derived values use the recording with its corrections applied
  ([ADR 0002](./adr/0002-recordings-are-immutable-corrections-are-layered.md));
- a judged workout outcome survives its workout being removed from the plan;
- `CoachingAccess` refuses a coach without access to the athlete;

regressions for a real past bug (a test from a `fix:` commit stays); and
convention tests.

Not worth a test:

- **Tautologies**: a fake returning what it was given, a restated constant,
  config or lookup table, a snapshot of static markup, a type being a type.
- **Implementation details**: call counts, call order, private helpers or
  internal state shape. Anything that breaks on a harmless refactor.
- **Near-duplicates**: the same rule at the same seam with another literal.
- **Glue**: a pass-through, a one-line mapping, a handler that parses and
  delegates. Test what it delegates to.
- **Someone else's code**: that Zod parses, React renders or Drizzle inserts.

Prefer one test at the right seam over the same rule re-checked through the
use case, the contract and the screen. For front-end logic the right seam is a
pure reducer driven by events, not a rendered component.

## The three suites

[ADR 0007](./adr/0007-default-tests-never-touch-the-database.md) and
[ADR 0008](./adr/0008-the-api-is-composed-from-injected-adapters.md) split the
tests by cost:

1. **`pnpm test`**, run constantly. Each context's `domain` and `application`
   code with the in-memory fakes from its `./testing` subpath, and the
   context's part of the contract tested in-process through
   `createRouterClient(createXRouter(fakes), { context })`, with no Hono and no
   `apps/api`. Never touches Postgres, the network or the filesystem, except to
   read checked-in fixture files (a FIT file from a real watch); a test never
   writes one. `apps/api` tests only check how the app is put together, through
   `createTestApp`.
2. **`pnpm test:adapters`**, run in CI. Each port's behaviour suite (exported
   from `./testing`) run against Postgres, so a fake can't drift from its real
   adapter. Postgres here, and in the end-to-end flows, is TEST_DATABASE_URL
   (`varda_test` locally), never the database `pnpm dev` uses. Kept to an absolute minimum: about one case per port method,
   showing the real adapter agrees with its fake. Edge cases are tested through
   the fakes in the default suite, never here.
3. **Playwright end-to-end flows**, run in CI. A handful only: sign in, plan a
   workout, place a stone from a FIT file. The only runtime test across two
   contexts is the stone flow.

Component tests are rare and test only the wiring: which key, click or blur
dispatches what, and browser-only behaviour a function can't reproduce (focus
order, keyboard handling, effect lifecycle). If the behaviour can be pulled
into a reducer or a plain function, do that and test it directly. One component
test per behaviour, not one per component; act like a user (find by role,
label or text) and assert what a user or the parent sees.

## Good tests

Exercise real code paths through the public interface: the contract client, a
use case or a pure function. They describe _what_ the system does, not _how_.
Set up through the client too; seed a fake directly only for state the contract
can't create (a recording that arrived by sync).

```typescript
// GOOD: behaviour through the contract, set up and read back through it
const { client } = recordTestClient({ as: athlete });

it('shows a corrected distance on the stone', async () => {
  const stone = await client.stones.place({ fit: treadmillRun });
  await client.stones.correct({ id: stone.id, distance: 10_000 });

  const shown = await client.stones.get({ id: stone.id });
  expect(shown.distance).toEqual({ metres: 10_000, corrected: true });
});
```

- Test behaviour users or callers care about.
- Use the public interface only.
- Survive internal refactors.
- One logical assertion per test.

## Bad tests

```typescript
// BAD: mocks a module and asserts HOW, not WHAT
vi.mock('../adapters/postgres/stones.ts');
it('correctStone saves the correction', async () => {
  await correctStone(adapters, { id, distance: 10_000 });
  expect(saveCorrection).toHaveBeenCalledWith(id, { distance: 10_000 });
});

// BAD: verifies through the fake's internals when the contract can read it back
it('stores the correction', async () => {
  await client.stones.correct({ id, distance: 10_000 });
  expect(fakes.stones.rows.get(id)?.corrections).toHaveLength(1);
});

// BAD: restates a one-line mapping; the function IS the spec
it('maps Garmin running to the running sport', () => {
  expect(sportFromGarmin('running')).toBe('running');
});
```

Red flags:

- Mocking anything, or importing `vi`.
- Testing private functions.
- Asserting on call counts or the order of internal calls.
- A test that breaks on a refactor without a behaviour change.
- A test name that describes HOW, not WHAT.
- Verifying through a fake's internals or the database instead of the
  interface.
- Testing a trivial function where the test just mirrors the code.
- A thin delegation test for a handler whose only job is to parse input and
  call a use case. Test the use case.

## Ports are named after their questions

A port belongs to the context that asks, is named after what it asks, and has
one method per question with one return shape: Record's
`PlannedWorkouts.onDay(person, day)` and `PlannedWorkouts.byId(id)`, not a
generic `PlannedWorkouts.query(filter)`
([ADR 0005](./adr/0005-modular-monolith-with-a-schema-per-context.md)). Its fake
is then a few lines with no conditional logic in test setup, and its behaviour
suite is short.

## TDD workflow: vertical slices

Write one test, make it pass, then write the next. Writing every test first
produces tests that verify _imagined_ behaviour and are insensitive to real
changes.

```
RED→GREEN: test1→impl1
RED→GREEN: test2→impl2
RED→GREEN: test3→impl3
```

Each test responds to what you learned from the previous cycle. Get to GREEN
before you refactor.
