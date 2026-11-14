# Glossary Map

Varða models training as a **journey**: stones are placed one at a time on the way to a destination. Canonical terms are themed English words; the Icelandic UI translates them.

## Contexts

- [Shared](./docs/contexts/shared/GLOSSARY.md): people, athletes, coaches, sports, zones, strength exercises and strength sets, used identically by both contexts
- [Plan](./docs/contexts/plan/GLOSSARY.md): looking ahead: journeys, stages, workouts and the workout library (product area: **Splitsmith**)
- [Record](./docs/contexts/record/GLOSSARY.md): looking back: stones, workout outcomes, the journal, milestones and the cairn (product area: **Varða**)

Glossaries live under `docs/contexts/` until the packages exist; each then moves into its package (`packages/shared`, `packages/plan`, `packages/record`).

## Relationships

- **Record → Plan**: Record reads workouts and their workout steps to match a stone's laps to them and to judge the workout outcome. It refers to journeys by identity and dates to build each cairn.
- **Plan → Record**: Plan reads workout outcomes to show them next to the plan. It never changes a workout because of one.
- **Plan, Record → Shared**: both use the shared terms; neither changes them.
- Each context refers to the other's things by identity only and never changes them.
