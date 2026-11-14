# One modular monolith, with a module and a database schema per context

The backend is a single deployable application written in TypeScript, made of one module per context: `plan`, `record` and `shared` (ADR 0004). Each module owns its own PostgreSQL schema and exposes a small public interface; no module reads another's tables or reaches into its internals, and the boundaries are enforced by the build, not by convention. Original recordings live in object storage, not the database (ADR 0002). We chose this over separate services because Plan and Record talk to each other on almost every request (matching a stone's laps to a workout's workout steps, showing workout outcomes next to the plan) and the Shared context (coaching relationships, who can see what) is needed by both, so separate services would have meant network calls, copied data and a third service from day one, for a single developer with no users yet.

Code and packages are named after the contexts (`plan`, `record`, `shared`), never after the product areas (Splitsmith, Varða): "Varða" is also the name of the whole app, so a `varda` package would be ambiguous.

## Considered Options

- **Two services, `splitsmith` and `varda`, behind an API gateway.** Strong isolation, but every Record↔Plan interaction crosses the network, the Shared context has no natural home, and the gateway tends to collect domain logic.
- **A plain monolith without enforced modules.** Simplest, but nothing stops the contexts leaking into each other, which ADR 0004 exists to prevent.

## Consequences

- **Context packages never import each other; each may import only `shared`.** Plan and Record read from each other in both directions (Record reads workouts, Plan reads workout outcomes), so a one-way package dependency can't express the relationship. Instead the reading context defines the interface it needs (e.g. Record's `PlannedWorkouts`), and `apps/api` wires the other context's implementation into it. Screens that show both, such as the plan with its workout outcomes, call both contexts' contracts and combine them in the web app.
- These rules, and the layering inside each package, are checked in CI by dependency-cruiser.
- A module can later be pulled out into its own service; its schema and public interface are already the seam.
- Cross-context references are identities only, so there are no foreign keys between schemas.
