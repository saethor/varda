# Product decisions

Decisions made while modelling the domain that are not glossary terms and don't meet the bar for an ADR. Terms live in the glossaries (see [`GLOSSARY-MAP.md`](../../GLOSSARY-MAP.md)); hard-to-reverse decisions live in [`docs/adr/`](../adr/). Open questions are GitHub issues labelled `needs-triage`.

Each decision is a statement, followed by the reason.

## Principles

- **Varða is built on trust and transparency, not social competition.** The relationship between athlete and coach is the core; nothing in the product should reward showing off over training well.
- **Great training tools come first.** Social features are not out of scope, but they are nice-to-haves, never a priority over planning, recording and analysis.
- **Everything the athlete does builds towards the destination.** Every sport counts as a stone, and every day can be written about, rest or not.
- **The plan stays as it was planned.** What happened is recorded next to the plan, never by changing it, so the coach can always see planned against actual.

## Language in the UI

Canonical terms are themed English; Icelandic is a translation (see [ADR 0001](../adr/0001-themed-english-as-canonical-vocabulary.md)).

- **Use a themed word only when it is clearly part of the theme and stays clear.** "Place a stone" is core language and is used. Anything else is decided one word at a time during implementation. Like "tweet": our own words are fine, as long as they are clear and not overused.
- **Every themed noun gets a plain subtitle the first time it appears and in empty states**, e.g. _Stones: your completed activities_, _Rest stop: planned rest day_.
- **Two themed words never compete for the same thing.** A stone is always done, a workout is always planned, a milestone is only ever an achievement.

## Who can do what

| | Athlete | Coach | Former coach |
|---|---|---|---|
| See stones, workouts, journeys, journal | ✓ | ✓ except private journal entries | ✗ |
| Plan and change workouts, rest stops, journeys, stages | ✓ | ✓ | ✗ |
| Correct a stone | ✓ | ✗ (leaves a journal comment instead) | ✗ |
| Mark a journal entry private | ✓ | ✗ | ✗ |
| Write journal comments and reactions | ✓ | ✓ | ✗ |
| Set zones | ✓ | ✓ | ✗ |
| Start or end a coaching relationship | ✓ | ✓ | n/a |
| Export or delete all data | ✓ | ✗ | ✗ |

- **An athlete can have any number of coaches, all with full access.** Limiting a coach's access is never a good thing; revisit only with a concrete reason.
- **Every change to a workout is kept in its history**, with who made it. With several coaches able to edit, nothing may change silently.
- **When a coaching relationship ends, everything the coach contributed stays with the athlete**, still attributed to them.

## Recording

- **Integration order:** manual watch-file upload (FIT/GPX) and manual entry first, then direct Garmin sync. The first target watch is the Garmin Forerunner 255.
- **Send to watch targets Garmin structured workouts**, which map directly onto workout steps, repeat blocks and step targets.
- **A watch file is at most 25 MB, counted as 25,000,000 bytes**, the way the athlete's computer shows file sizes. A file that can't be placed is turned away with its reason, and the message always says that nothing was kept.
- **The original file of every stone is kept** (see [ADR 0002](../adr/0002-recordings-are-immutable-corrections-are-layered.md)), so new metrics can be calculated from old stones.
- **Platform metrics the watch provides** (running power, HRV, Garmin's own load) are kept when present, as reference data.
- **The app suggests which workout a stone fulfils and its workout outcome; the athlete confirms.**
- **Deviation reasons are a short fixed list** (illness, niggle, fatigue, weather, time, conditions, felt good / did more, other), so a coach can see patterns; the story goes in the journal entry.
