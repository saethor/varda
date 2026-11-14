# Default tests never touch the database, the network or the filesystem

`pnpm test` must stay fast enough to run constantly, including when an AI writes many tests at once. So the default Vitest suite covers each context's `domain` and `application` code with in-memory fakes of its interfaces (repositories, readers of the other context, Garmin), and never touches Postgres, the network or the filesystem. Real Postgres is used only in a small, separate adapter suite (`pnpm test:adapters`), written only where the SQL is non-trivial, and in a handful of Playwright end-to-end flows (sign in, plan a workout, place a stone from a FIT file). Both run in CI, not on every save.

## Consequences

- All I/O sits behind interfaces in each package's `adapters` layer, so use cases can be tested with fakes. This is a design constraint, not only a testing one.
- Don't "improve coverage" by adding database tests to the default suite; add a fake or an adapter test instead.
- Reading checked-in fixture files (a FIT file from a real watch) is allowed: the rule is about state and I/O behind ports, not test inputs. A default test never writes to the filesystem.
