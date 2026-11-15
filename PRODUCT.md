# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Web only for the foreseeable future, used on both phone and desktop. Native iOS and Android apps are a possible later experiment if Varða goes fully public; nothing is planned yet.

## Users

**Primary:** the builder, a runner who also does strength training, and soon a small circle of friends and family. They train toward a goal and use Varða to plan the work, record what they did, and look back on how far they have come.

**Later:** the product is designed to become public, so it must work for other runners who coach themselves and for coaches who plan for athletes (see the coaching relationship in `packages/shared/GLOSSARY.md`). Design for a person who is not the builder, without building for a crowd that does not exist yet.

The usage scene is split: the phone right after a session (place the stone, rate effort, write a journal entry) and the desktop for planning and analysis (the journey, stages, charts, the Path).

## Product Purpose

Varða keeps people running and training. It is a training diary and workout analyser, running first with strength alongside. It has two product areas:

- **Splitsmith** (Plan) looks ahead: journeys, stages, workouts and the workout library, sent to the watch.
- **Varða** (Record) looks back: stones, workout outcomes, the journal, milestones, the cairn and the Path.

Success means the athlete keeps training over the long term: healthy, consistent, and moving toward the destination they chose.

## Positioning

The product is built around the **journey**. A clear destination, a well-defined route and waypoints along the way are the best way to stay focused and healthy. Varða makes that journey visible and rewarding: each session is a stone placed on the cairn, and progress toward the destination is the reward.

This is not a social network. Strava owns the social feed, and Varða deliberately does not mirror it. Unlike Garmin Connect and TrainingPeaks, Varða calculates its own transparent training load (ADR 0003) and treats the athlete–coach relationship as built on trust rather than on compliance tracking.

## Operating Context

- Sessions come from watch files (FIT/GPX) and manual entry first, then direct Garmin sync. The first target watch is the Garmin Forerunner 255.
- Planned workouts are sent to the watch as Garmin structured workouts.
- The athlete confirms which workout a stone fulfilled and its workout outcome; the app only suggests.
- A coach can see all of an athlete's training except private journal entries, and plans alongside the athlete. Every change to a workout is kept in its history with who made it.

## Capabilities and Constraints

- The vocabulary is themed English and is canonical in code and docs: journey, destination, waypoint, stage, rest stop, stone, cairn, journal, milestone, the Path, odometer. The Icelandic UI translates it (ADR 0001). Glossaries: `GLOSSARY-MAP.md` and each package's `GLOSSARY.md`.
- Use a themed word only when it stays clear. Every themed noun gets a plain subtitle the first time it appears and in empty states (e.g. _Stones: your completed activities_). Two themed words never name the same thing: a stone is always done, a workout is always planned.
- The UI ships in English and Icelandic (Lingui), and copy must fit both.
- The plan is never rewritten to match what happened. Planned and actual sit side by side.
- Recordings are never changed. Corrections are layered on top, marked as corrections, and can be reverted (ADR 0002).
- Varða's own training load is the only load used in analysis. Platform metrics are kept as reference data only. The load formula is still undecided.
- Stack: Vite + React SPA (TanStack Router/Query, Tailwind, shadcn/ui in `packages/ui`), Hono + oRPC API, Postgres.

## Brand Commitments

- **Name:** **Varða** in the logo, `varda` in URLs and code, pronounced _VAR-tha_. A varða is a stone cairn that marks the way across Iceland's highlands. **Splitsmith** is the planning area; the Icelandic _steinsmiður_ (stonemason, a stone-smith) ties the smith to the cairn.
- **Line:** "Splitsmith shapes the stone. Varða shows the way."
- **Metaphor:** each session is a stone, the cairn grows over the journey, and looking back shows the road travelled. The metaphor is core to the product, not decoration.
- **Assets:** `logo/` holds the Varða and Splitsmith wordmarks (light and dark), the cairn marks (stacked and splits), the vörður mark, and the app icons. `logo/final/` and `logo/build/` hold the produced versions.

## Evidence on Hand

- There are no users, testimonials, metrics or press yet. Future work must not invent any.
- What exists: the domain model (glossaries, `docs/product/decisions.md`, `docs/adr/`), the logo set, and working sign-up, sign-in and sign-out screens.

## Product Principles

1. **The journey is the game.** Motivation comes from a clear destination, a visible route, waypoints, and the cairn growing stone by stone. Rewards measure progress toward one's own goal, never ranking against other people.
2. **Keep people training and healthy.** Consistency over heroics. Nothing should reward overreaching or showing off over training well. Rest stops and every sport count toward the journey.
3. **Trust and transparency, not social competition.** The athlete–coach relationship is the core relationship. Social features are optional extras, never a priority, and never a Strava-style feed.
4. **Great training tools come first.** Planning, recording and analysis outrank everything else.
5. **The record is honest.** The plan stays as planned, recordings stay as recorded, and corrections are visible.
