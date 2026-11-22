---
version: 1
slug: "src-routes-signed-in-stones-tsx"
primary_target: "src/routes/_signed-in/stones.tsx"
related_targets: ["src/stones/stone-card.tsx"]
---

---
version: 1
slug: "src-routes-signed-in-stones-tsx"
primary_target: "src/routes/_signed-in/stones.tsx"
related_targets: ["src/stones/stone-card.tsx"]
---

# Stones list

**Scope:** the stones screen's list view (`/stones`), looking back. Mode: **Operate**. The calendar view (`?view=calendar`) is out of scope for now; it will look ahead (planned workouts) later. The new palette lands app-wide (user approved).

**Audience and task:** the athlete, on a phone right after a session (most people) or at a desk (the builder). In order: (1) see the stone just placed / the latest stone, (2) see consistency: how the weeks are going, (3) open a past stone.

**Constraints:** Record vocabulary (stone, placing a stone, week). No lifetime stone count exists in the API, so stones carry no sequence number. English and Icelandic copy must both fit. Light only.

## Direction contract

THESIS: The record looks back as one line of weeks: the latest stone leads on a dark plate, consistency reads as knitted rows of days, and every stone is a station on the route. It refuses the category's stack of identical activity cards.

OWN-WORLD: Sauðalitir, the colours of undyed Icelandic wool. Light grey heather ground, near-white wool cards, black-brown ink and shell, brand lichen as the only bright on dark. Dyed yarns name the sport group: rust for running, indigo for strength, bottle green for cross-training, grey for other. 1px hairlines, 2px corners, tabular numerals, system sans.

STORY: The athlete sees the stone they just placed at once, then glances at twelve rows of days to see whether the habit holds, then scans down the route to find a stone and open it.

FIRST VIEWPORT: A black-brown shell bar (wordmark, nav). Under it, "Stones" with a List | Calendar switch, then a slim full-width Place a stone bar (it stays on the page because refusals need room to explain themselves and the page is the drop target; it matches the calendar view). Left two-thirds: the latest-stone plate (black-brown, sport, day, "2nd stone this week", big distance, time and pace, its trace in lichen). Right third, beside the plate and sticky as the route scrolls: Last 12 weeks, seven stitch cells per row, dyed by sport, with a per-week count. Below: the route timeline. A vertical line in the gutter with a station per stone in its sport dye; week bands cross it with right-aligned totals; empty weeks run the line dashed.

FORM: candidate 3 of 7 (Sauðalitir yoke), fused with the competitive challenger's route line (wayfinding-cartography-signage-midnight-transit-diagram) at the user's request. seed:fe551c94c632e268

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: hovering or focusing a station lights its row and its stitch cell in the 12-week rows; a just-placed stone's station settles onto the line (the existing stone-settle motion).

## Unresolved
- "Feed" renamed to "List" (the user calls it the list view); confirm the Icelandic.
- Stone sequence numbers need a lifetime count from the API.
