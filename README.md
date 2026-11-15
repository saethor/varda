# Varða

> **Splitsmith shapes the stone. Varða shows the way.**

A personal training diary and workout analyzer, built first and foremost for running, with strength training alongside. An alternative to Strava, Garmin Connect, and TrainingPeaks, tailored to how I train.

---

## The idea

A **varða** is a stone cairn that marks the way across Iceland's highlands. Travelers added stones over generations, so the path got clearer over time.

Your training works the same way. Each run is a stone, the cairn grows over time, and looking back shows you the road you've traveled.

**Splitsmith** is where those stones get shaped. Fittingly, the Icelandic word for stonemason is ***steinsmiður***, a stone-smith, so the smith and the cairn belong to the same story.

---

## How the two parts fit together

```
 SPLITSMITH                      WATCH                  VARÐA
 ──────────                      ─────                  ─────
 Build the workout   ──sync──▶   Run it    ──upload──▶  The stone is placed
 Shape intervals,                                       Analysis, notes, diary,
 splits and strength                                    long-term journey
```

- **Splitsmith** looks ahead: plans, structured workouts, strength sessions, syncing to the watch.
- **Varða** looks back: the diary, the analysis, your trends and progress.

### Core features

- Running diary with notes after every workout
- Detailed breakdown and analysis of each workout
- Charts and analytics that other apps are missing
- Workout schedule that syncs to the watch
- Strength training sessions alongside running

---

## Development

Requires Node 24 (`.nvmrc`), pnpm and Docker.

```sh
pnpm install
cp .env.example .env
pnpm db:up        # Postgres (docker-compose.yml)
pnpm db:migrate   # every context's migrations; safe to re-run
pnpm dev          # api on :4000, web on :5173 (proxies /rpc to the api)
pnpm check        # lint, "user" check, boundaries, typecheck, tests; never touches Postgres
pnpm test:adapters # ports' behaviour suites against Postgres (CI runs it too)
```

```
apps/
├── web/          # Vite + React SPA: TanStack Router/Query, Tailwind
└── api/          # Hono + oRPC: implements @varda/contract, wires the contexts
packages/
├── shared/       # one package per context: src/{domain,application,adapters},
├── plan/         #   contract.ts (public to web), index.ts (public to api),
├── record/       #   GLOSSARY.md
├── contract/     # composes the contexts' contracts into the one API contract
├── ui/           # design system: Varða palette, shadcn components
└── config/       # shared tsconfig
```

Module boundaries (ADR 0005) are checked by `pnpm depcruise`; see `.dependency-cruiser.cjs`. The default tests never touch the database, network or filesystem (ADR 0007). TypeScript stays on 6.x until TypeScript 7 publishes the compiler API that dependency-cruiser needs.

---

## Name and practical details

| | |
|---|---|
| **Pronunciation** | *VAR-tha* (the ð sounds like the "th" in "this") |
| **Written form** | **Varða** in the logo, **varda** in URLs and code |
| **Domains to check** | varda.run · varda.app · getvarda.com · splitsmith.app |
| **Plural** | *vörður*: a row of cairns marking a whole route |

**Watch out for:**
- The "ð" doesn't work in URLs or on most keyboards, so always use `varda` as the fallback.
- "Varda" is also a Tolkien character, and there's a space company called Varda Space Industries. That only matters if the app ever goes public.

---

## Taglines

**Varða**
- *"One stone at a time."*
- *"Every run marks the way."*
- *"Build your path."*
- *"Look back. See how far you've come."*

**Splitsmith**
- *"Forge your fitness."*
- *"Fitness is forged, one split at a time."*
- *"Shape the work."*

---

## Feature names

A mix of Icelandic and English: Icelandic for the journey parts, English for the tools.

### Varða (looking back)

| Feature | Name | Meaning |
|---|---|---|
| A single workout | **Stone** | Each run adds a stone to the cairn |
| Training diary / notes | **Dagbók** | "Diary" |
| Workout breakdown | **Breakdown** | Plain English, since this is the part you'll use most |
| Long-term trends | **Leiðin** | "The path": how far you've come |
| PRs and milestones | **Vörður** | The cairns along your route |
| Lifetime totals | **Odometer** | Total kilometers, hours, sessions |

### Splitsmith (looking ahead)

| Feature | Name | Meaning |
|---|---|---|
| Workout builder | **Forge** | Where you shape intervals and splits |
| Strength sessions | **Anvil** | The iron side of training |
| Training blocks | **Áfangi** | "Stage of a journey": a 4–6 week block |
| Rest and recovery days | **Áning** | The traditional rest stop on a highland journey |
| Goal race | **Markið** | "The goal" or "the finish" |
| Watch sync | **Send to watch** | Kept simple on purpose |

*Áning* is a particularly good fit. It's where travelers stopped to rest the horses before moving on, which is exactly what a recovery day is.

---

## Visual identity

**Varða logo (final):** a cairn of five stacked stones that is also a **negative-split chart**: each stone is a kilometer, each one shorter (faster) than the one below, with the fastest on top in the accent color. The wordmark is custom capitals, **VARÐA**, where the Ð's crossbar is that same accent stone. See [`logo/final/`](logo/final/) for the files and the [concept write-up](logo/final/README.md).

**Splitsmith icon:** a hammer striking a stone, or a single stone with clean chiseled facets.

**Colors (taken from the Icelandic highlands):**

| Role | Color | Hex |
|---|---|---|
| Base | Basalt gray / near-black | `#2B2E2F` |
| Primary | Moss green | `#5E7A4E` |
| Accent | Lichen yellow-green | `#B5C26A` |
| Splitsmith accent | Ember orange (the forge) | `#E0662A` |
| Errors | Lava red | `#8C2F39` |
| Background | Snow / pale ash | `#F3F1EC` |

Varða should feel calm, earthy, and reflective, and Splitsmith adds the heat of the forge.

The final logo is in [`logo/final/`](logo/final/) (open `index.html`). The first round of mockups, including the Splitsmith icon, is in [`logo/preview.html`](logo/preview.html).

---

## Next steps

1. Check that the domains are available: varda.run, varda.app, splitsmith.app
2. ~~Pick a logo direction from the mockups~~ Done: see [`logo/final/`](logo/final/). Splitsmith's icon still needs updating to match.
3. Plan the data model (stones, dagbók entries, áfangar and so on) so the theme carries into the code
