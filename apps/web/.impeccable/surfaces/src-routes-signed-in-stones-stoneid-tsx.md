---
version: 1
slug: "src-routes-signed-in-stones-stoneid-tsx"
primary_target: "src/routes/_signed-in/stones_.$stoneId.tsx"
related_targets: ["src/stones/stone-week-view.tsx"]
---

# Stone screen

**Scope:** one stone (`/stones/$stoneId`), looking back. Mode: **Operate**. Wide layout. Light only.

**Audience and task:** the athlete, on a phone right after placing a stone, or at a desk looking back. In order: (1) see that the stone was placed and where it sits in its week, (2) read what it was: its figures and its trace, (3) read how it went lap by lap, (4) walk on to the stones either side, or delete it.

**Constraints:** Record vocabulary (stone, placing a stone, recording, lap, trace, moving time, elapsed time). The API carries no journey, stage, workout, workout outcome, effort, journal entry, correction or training load yet: nothing of them is shown or faked, and the screen keeps a place between the stone's record and the walk where planned-against-actual and the journey will go. A **cairn** is the stones of one journey, so the week is never called a cairn. English and Icelandic copy must both fit.

## Direction contract

THESIS: A stone is one stitch of its week, pulled out and opened. The screen opens on the week's seven days, and the stone's own day opens down into the plate. It refuses the activity-detail template of a map, a tile wall of metrics and a chart dump.

OWN-WORLD: Sauðalitir. Heather ground, wool panels, svart ink, the one svart plate holding the stone, its trace in lichen. The sport's dye fills the stitches and the lap profile and nothing else. 1px hairlines, ink rules, 2px corners, tabular numerals, system sans.

STORY: The athlete sees the week the stone belongs to and which day it is, reads the stone on the plate (sport, day, nth stone this week, lead figure, trace), reads the laps as a profile and a table, then walks to the next stone through the week row or the stones either side.

FIRST VIEWPORT: Shell; "← Stones"; the week heading (dates, This week / Last week, the week's totals right-aligned); a full-width row of seven day cells, each a stitch dyed by its stones, every stone a link; the stone's day is a svart tab joined to the plate below. Plate: left the sport (h1), day, start time and "nth stone this week" in lichen, the lead figure in display type, the other figures on a shell rule; right the trace, large, in lichen with its start marked. Below: Laps, a full-width profile (width by distance, height by speed, in the sport's dye, lap numbers beneath), then the lap table.

FORM: candidate 3 of 7 on the re-roll ("From stitch to stone"), carrying the user's steer from round one: card 2's big trace and card 1's lap profile. seed:64e0f8945825c75e

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: pointing at or focusing a lap, in the profile or the table, makes it the one active lap: its block stays full and the others drop back, its row lights. Just after placing, the stone's stitch settles into the week row (stone-settle) while the plate says "Placed."

## Unresolved
- The week mark that called a week's stones a cairn is replaced by the stitch settling into the week row; confirm the name is free for the journey.
- Where the journey and planned-against-actual sit once they exist (reserved between the laps and the walk).
