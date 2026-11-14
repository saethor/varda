# Plan and Record are separate contexts with a shared kernel

The domain splits into **Plan** (looking ahead: journeys, stages, workouts, the workout library; shown as Splitsmith) and **Record** (looking back: stones, workout outcomes, the journal, milestones, the cairn; shown as Varða). A small **Shared** kernel (athlete, coach, coaching relationship, sport, zones, strength exercise, strength set) is used identically by both. We chose this over one shared context because planning and recording change for different reasons and at different times, and a plan must stay exactly as it was planned whatever happened on the day.

## Considered Options

- **One "Journey" context.** The two sides share many terms, which made this tempting, but it would let what happened leak into what was planned.

## Consequences

- **Workout outcome, deviation reason and unplanned stone belong to Record**, not to the workout. Record reads workouts and their workout steps from Plan, matches a stone's laps to them, and judges the workout outcome. Plan only shows workout outcomes; a missed workout stays exactly as planned.
- **Plan owns the journey** (destination, open journey, waypoints, stages, training weeks); Record owns the **cairn** and the **journey result**, and refers to the journey by identity and dates.
- Each context refers to the other's things by identity only and never changes them.
- Glossaries live in `docs/contexts/{shared,plan,record}/` until packages exist; see `GLOSSARY-MAP.md`.
