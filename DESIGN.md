---
name: Varða
description: A training diary built around the journey. Undyed wool, dyed yarns, one stone at a time.
colors:
  svart: "#2a2420"
  heather: "#dedfdc"
  wool: "#f4f4f2"
  heather-deep: "#cbcdc8"
  heather-hover: "#cfd1cc"
  heather-muted: "#d3d5d0"
  hairline: "#c3c5c0"
  field-edge: "#7c7a74"
  muted-ink: "#5c5752"
  shell-ink: "#f2f1ec"
  shell-muted: "#b3ab9f"
  shell-line: "#4a423c"
  dye-running: "#a4482a"
  dye-strength: "#2f4a6e"
  dye-cross-training: "#3f5e45"
  dye-other: "#8d8a84"
  measure-heart: "#9a2f62"
  measure-power: "#8f6a0c"
  measure-stride: "#2a6f6c"
  measure-ground: "#6e6556"
  lichen: "#b5c26a"
  lava: "#8c2f39"
  basalt: "#2b2e2f"
  moss: "#5e7a4e"
  snow: "#f3f1ec"
  ember: "#e0662a"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "\"tnum\""
  headline:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
  title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.75rem"
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  body-sm:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1
  caption:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
rounded:
  xs: "2px"
  sm: "2px"
  md: "2px"
  lg: "3px"
  xl: "4px"
  full: "9999px"
spacing:
  hair: "4px"
  tight: "8px"
  snug: "12px"
  base: "16px"
  panel: "20px"
  section: "24px"
  plate: "28px"
  page: "32px"
components:
  button-primary:
    backgroundColor: "{colors.svart}"
    textColor: "{colors.wool}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.heather-deep}"
    textColor: "{colors.svart}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.heather}"
    textColor: "{colors.svart}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.heather-hover}"
    textColor: "{colors.svart}"
  button-destructive:
    backgroundColor: "{colors.lava}"
    textColor: "{colors.wool}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  input:
    textColor: "{colors.svart}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  panel:
    backgroundColor: "{colors.wool}"
    textColor: "{colors.svart}"
    rounded: "{rounded.xs}"
    padding: "20px"
  card:
    backgroundColor: "{colors.wool}"
    textColor: "{colors.svart}"
    rounded: "{rounded.xl}"
    padding: "24px"
  plate:
    backgroundColor: "{colors.svart}"
    textColor: "{colors.shell-ink}"
    rounded: "{rounded.xs}"
    padding: "28px"
  shell-bar:
    backgroundColor: "{colors.svart}"
    textColor: "{colors.shell-ink}"
    height: "56px"
  nav-link:
    textColor: "{colors.shell-muted}"
    typography: "{typography.body-sm}"
  nav-link-active:
    textColor: "{colors.shell-ink}"
  view-toggle-active:
    backgroundColor: "{colors.svart}"
    textColor: "{colors.wool}"
    typography: "{typography.label}"
    padding: "6px 12px"
  view-toggle:
    textColor: "{colors.svart}"
    typography: "{typography.label}"
    padding: "6px 12px"
  station:
    backgroundColor: "{colors.wool}"
    rounded: "{rounded.full}"
    size: "20px"
  alert-destructive:
    backgroundColor: "{colors.wool}"
    textColor: "{colors.lava}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
---

# Design System: Varða

## Overview

**Creative North Star: "The Sauðalitir Yoke"**

Varða is dressed in sauðalitir, the colours of undyed Icelandic wool: a light grey heather ground, near-white wool for cards and panels, and black-brown svart for ink, the shell bar and one dark plate per screen. Colour enters only as dyed yarn, one dye per sport group, the way a lopapeysa yoke takes a few dyed rows on undyed wool. Brand Lichen is the one bright, and it lives on the dark. The mood is calm, plain and exact, like a well-knitted, well-kept field notebook. Splitsmith, the planning area, keeps Ember for its forge. Varða itself stays in wool.

The system is a retuned shadcn/ui (new-york): the defaults are moved onto the wool palette, corners are pulled in to knitted-edge tightness (2–4px), and depth is tonal. Density is moderate on the wide desktop screens and unhurried on phones. Numbers carry the content, so they are set large, semibold and tabular. Records read as structure (rows of stitches, a route line with stations, ink rules across week heads) rather than as stacks of identical cards. The brand shows in the palette, the drawn wordmark and the vocabulary, not in ornament.

Rejected: a Strava-style social feed (bright orange, kudos, leaderboards), Garmin Connect or TrainingPeaks density (walls of dark metric tiles), a stack of identical activity cards, and generic neutral-gray shadcn SaaS.

**Key Characteristics:**
- Heather ground, wool panels, svart ink and shell. Lichen only on svart.
- Four dyed yarns name the sport group: rust, indigo, bottle green and undyed grey.
- A dark svart shell bar on every signed-in screen, and at most one dark plate below it.
- 1px hairlines, ink rules for structure, tight 2–4px corners, no shadows in the page flow.
- The system sans, with tabular numerals for every figure.
- Light only. There is no dark mode.

## Colors

Undyed wool for every surface and all ink, a few dyed yarns for meaning, and the brand marks keeping their own colours.

### Primary
- **Svart** (`svart`): black-brown wool, the ink of the system. All body text and headings, primary button fills, the active segment of segmented controls, the shell bar, the latest-stone plate, ink rules under week heads, the route line, and text selection (Wool on Svart). In-sentence links are Svart and always underlined.

### Secondary
- **Dyed yarns** (`dye-running`, `dye-strength`, `dye-cross-training`, `dye-other`): one per sport group, so the sport reads before the name. Running is rust, strength is indigo, cross-training is bottle green, and anything else is undyed grey. They fill stitch cells, ring and fill route stations, and nothing else on the stones screen. On the stone screen the stone's own dye also draws how fast it went: the lap profile, the pace or speed chart, the split bars and the running stretches.
- **Strength Indigo** (`dye-strength`) doubles as the focus ring on the light ground (6.8:1 on Heather), the only dye with a system role.

### Measure tints
- **Crowberry, Birch Ochre, Sea-green, Stone** (`measure-heart`, `measure-power`, `measure-stride`, `measure-ground`): one per kind of measure on the stone screen, like plant-dyed yarn beside the sport dyes. Heart rate is crowberry, power birch ochre, stride (cadence and running form) sea-green, and the ground (elevation, ascent, descent) stone. How fast takes the stone's own dye. A tint draws its chart's line and the area under it, and keys that chart's name and its figures with a 4px stitch; figures of no chart (temperature, energy, weight and height) sit under an undyed stitch (Svart at 15%). Every tint is at least 3:1 on Heather (heart 5.3, power 3.7, stride 4.4, ground 4.3); none is ever text.

### Tertiary
- **Lichen** (`lichen`): the one bright. Used on Svart only: the shell's active-nav underline and focus outline, the plate's "nth stone this week" line, the plate's trace, and the plate's focus outline (7.9:1 on Svart). It is also the capstone colour of the logo on dark.
- **Ember** (`ember`): Splitsmith's forge accent, reserved for the planning area. Fills, marks and large type only, never small text.

### Neutral
- **Heather** (`heather`): the page ground, a near-neutral light grey.
- **Wool** (`wool`): cards, panels, popovers and alerts, one step lighter than Heather so they lift by value. Also the text on Svart and Lava fills.
- **Heather Deep** (`heather-deep`): secondary button fills ("Show earlier").
- **Heather Hover** (`heather-hover`): the hover fill of ghost and outline buttons and unselected segments.
- **Heather Muted** (`heather-muted`): muted surfaces, such as calendar week totals.
- **Hairline** (`hairline`): every border, divider and row separator.
- **Field Edge** (`field-edge`): input borders and the dotted route through empty weeks (3.2:1 on Heather).
- **Muted Ink** (`muted-ink`): secondary text, meaning dates, descriptions, the tagline, column heads and zero counts (5.3:1 on Heather, 6.5:1 on Wool). It is warmer than the grey surfaces, a brown-grey of the same wool as Svart.
- **Shell Ink / Shell Muted / Shell Line** (`shell-ink`, `shell-muted`, `shell-line`): text, secondary text and rules on the Svart shell and plate (13.5:1 and 6.7:1 on Svart).

### Brand marks
- **Basalt, Moss, Snow** (`basalt`, `moss`, `snow`): the logo's own colours, kept for the drawn wordmark and cairn. They are not interface colours.

### Error
- **Lava** (`lava`): errors and destructive actions only. Destructive alert and field-error text, and destructive button fills (7.4:1 on Wool).

### Named Rules
**The Lava, Never Ember Rule.** Errors are Lava. Ember belongs to Splitsmith's forge and never signals a problem, and no dye ever signals one either.

**The Logo Pairing Rule.** On light backgrounds the wordmark and cairn are Basalt with a Moss accent. On dark backgrounds (the Svart shell) they are Snow with a Lichen accent. Never mix the pairs, for example Lichen on Snow.

**The Lichen On Dark Rule.** Lichen appears only on Svart. On the light ground the highlight is Svart ink or a Strength Indigo ring, never Lichen.

**The Dyed Yarn Rule.** A dye names a sport group and nothing else (on its own stone's screen, that sport's way of going: how fast). Dyes are fills, rings and marks, never small text on the ground (Running is 4.4:1 on Heather, Other 2.6:1). A new sport joins one of the four groups; it does not get a new dye.

**The Measure Tint Rule.** A measure tint names a kind of measure and nothing else, the same on its chart and its figures. A new chart joins one of the four measures, or draws undyed; it does not get a new tint. Tints are lines, fills and stitches, never text, and never a sport.

## Typography

**Body Font:** the system sans (`ui-sans-serif, system-ui, sans-serif`)
**Brand type:** the VARÐA wordmark and the tagline are drawn as vector shapes in `logo/final/`, not set in a font.

**Character:** Plain and native. The system face keeps screens quiet and fast in English and Icelandic. Personality comes from scale and weight on the numbers, and from the logo.

### Hierarchy
- **Display** (`display`): the plate's lead figure (3rem from 640px, 2.25rem on phones), semibold, tight, tabular. The plate's other figures step down to 1.875rem (1.5rem on phones). The stone plate's lead figure (distance, or moving time for strength) uses the same voice.
- **Headline** (`headline`): the one page heading (`h1`, "Stones", "Sign in"), and the sport name on the plate (with tight tracking).
- **Title** (`title`): section and dialog titles ("Laps", the calendar month).
- **Body** (`body`): the document base. Station names (500 weight), week headings (600 weight), panel text and descriptions on the wide screens.
- **Body small** (`body-sm`): dates beside a name, week totals, nav links, alerts, field help and errors. Inputs use 16px on phones (so iOS doesn't zoom) and drop to 14px from 768px.
- **Label** (`label`): buttons, segments and field labels.
- **Caption** (`caption`): stat labels on the plate, stitch-row heads and counts, badges and developer tooling.

### Named Rules
**The Two-Language Rule.** Every label must fit in both English and Icelandic. Icelandic words run long, so never set fixed widths on text-bearing controls and never truncate a label to make it fit.

**The Tabular Figures Rule.** Every number (distance, time, pace, dates, counts) is set with tabular numerals so columns and rows align.

## Layout

Signed-in screens sit under a full-width Svart shell bar (56px tall) holding the wordmark and the nav; the shell's inner row shares the page's width and side padding. Below it, a screen is either one centred column at most 28rem wide, or a wide screen at 72rem (`max-w-6xl`) set by a route's `staticData: { layout: 'wide' }`. Page padding is 20px on phones and 32px from 640px; blocks stack 24px apart. Signed-out screens (sign in, errors) have no shell: they keep the narrow 28rem column with the light wordmark and the tagline above the card, 32px padding.

The stones list is the first wide screen. From 1024px it is a two-column grid (content plus a 20rem side column, 32px apart): a slim full-width Place a stone bar, then the latest-stone plate in the content column beside the 12-week stitch rows, which stick 32px from the top as the route scrolls beneath the plate. On phones it is one column in task order: plate, stitch rows, placing panel, route.

The stone screen is the second wide screen, one column in reading order: "← Stones", the week row, the stone plate joined under it, the summary, the laps with the charts (from 1024px the upright lap profile beside the charts, heart rate first, then the table across the full width; narrower, the profile, the charts, then the table), the stretches, the splits, running form, measurements, the recording line, and the walk to the stones either side. Between the measurements and the recording line the screen keeps room for planned against actual and the journey, once they exist. On phones the same order holds; the trace moves between the plate's heading and its figures.

Inside panels, content insets 20px and items stack 12px apart. The plate insets 20px on phones and 28px from 640px. Spacing follows Tailwind's 4px step.

Lists are rows, not cards: hairline dividers between rows (12px vertical padding), with ink rules where a group begins.

## Elevation & Depth

Flat and tonal. Surfaces separate by value (Wool on Heather, Svart for the shell and the plate) and by 1px hairlines, never by shadow. Shadows are only for things that float above the page: dialogs, and the dev menu pinned to a corner. Outline buttons and inputs keep shadcn's almost invisible `shadow-xs` lip.

### Shadow Vocabulary
- **Lip** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): outline buttons and inputs only.
- **Float** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): small overlays fixed to the viewport (the dev menu).
- **Dialog** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): alert dialogs, over a 50% black scrim.

### Named Rules
**The Lift-By-Value Rule.** A surface in the page flow is lifted by a lighter tone and a hairline, never by a shadow. If it doesn't float over something, it gets no shadow.

**The One Plate Rule.** Below the shell, a screen has at most one dark Svart plate, and it holds the screen's lead content. Everything else sits on Heather or Wool.

## Shapes

Tight, like knitted edges. Controls, panels, the plate, stitch cells and segmented controls use 2px corners; alerts and dialogs 3px; shadcn cards 4px at most. Borders are 1px hairlines, or Field Edge on inputs; Svart 1px rules mark structure (week heads, the segmented control's frame). The only round shapes are the route's stations and interchange rings. There is no pill shape, and stones in the logo are never re-spaced or re-proportioned in UI.

## Components

Quiet and exact: plain shapes, one clear action, ink for structure, and dye only where it names a sport.

### Buttons
- **Shape:** tight corners (2px), 36px tall by default, with 24px (xs), 32px (sm) and 40px (lg) sizes and square icon sizes to match.
- **Primary:** a Svart fill with a Wool label at 500 weight; hover drops the fill to 90%. The one forward action on a screen ("Choose a watch file").
- **Secondary:** a Heather Deep fill with a Svart label; hover takes it to 80%. The alternative route ("Show earlier", sign in with a passkey).
- **Outline / Ghost:** outline is Heather with a hairline and a Lip shadow; ghost is bare. Both fill with Heather Hover on hover.
- **Destructive:** a Lava fill with a Wool label.
- **Link:** Svart text, underlined (4px offset, 500 weight) in running text.
- **Focus:** a solid 3px Strength Indigo ring on `:focus-visible`. **Disabled:** 50% opacity, no pointer events.

### Segmented control (view toggle)
- **Style:** a 1px Svart frame with 2px corners, segments 6px × 12px in label type. The current segment is a Svart fill with Wool text and carries `aria-current="page"`; others are Svart text that fill Heather Hover on hover. Focus is a 2px inset Strength Indigo outline. It switches List and Calendar on the stones screen, in the URL.

### Chips (Badges)
- **Style:** 2px corners, 2px × 8px padding, caption type at 500. Outline badges are Svart text on a hairline; filled badges use Svart, Heather Deep or Lava.

### Cards / Containers
- **Panel:** Wool, a 1px hairline, 2px corners, 20px inset (the placing panel, the stitch rows). While a file is dragged over it, the placing panel's border turns Svart over a 5% Svart tint.
- **Card:** shadcn's card, Wool with a hairline, 4px corners, 24px inset, 24px between header, content and footer. No shadow (Lift-By-Value).
- **Empty state:** a dashed Field Edge border at 60%, 2px corners, centred text.

### Inputs / Fields
- **Style:** a transparent fill with a Field Edge hairline, 2px corners, 36px height, 12px side padding, Muted Ink placeholder.
- **Focus:** the border turns Strength Indigo, with a solid 3px Strength Indigo ring.
- **Error:** the border and ring turn Lava, the label turns Lava, and a Lava message appears below. Server-found problems replace the field's own message rather than stacking on it.
- **Disabled:** 50% opacity.

### Alerts
- **Style:** Wool fill, hairline, 3px corners, 12px × 16px padding, small body type.
- **Destructive:** Lava text on Wool, not a Lava fill. The problem is named calmly.

### Navigation (shell bar)
- **Style:** a full-width Svart bar, 56px tall. The dark wordmark (`apps/web/src/assets/varda-wordmark-dark.svg`, Snow with the Lichen stone, 16px tall) leads, then the links 20px apart in small body type. Inactive links are Shell Muted and turn Shell Ink on hover or focus; the active link is Shell Ink over a 2px Lichen underline at the bar's bottom edge. Focus on the bar uses a Lichen outline, since the indigo ring would vanish on Svart.
- **Mobile:** the same row, with 20px side padding.

### Brand Header (signed-out screens)
The light wordmark (`apps/web/src/assets/varda-wordmark.svg`, Basalt with Moss, 24px tall, `alt="Varða"`) tops the narrow column, with the tagline "One stone at a time." 8px below in Muted Ink. The tagline is translated text, not the outlined tagline from the logo files. Below about 16px tall, use the cairn mark instead.

### Latest-stone plate
The one dark plate: Svart, 2px corners, 20px/28px inset, at least 224px tall. It holds the sport name (headline), the day and time in Shell Muted with the week ordinal in Lichen, then the figures in display type with caption labels in Shell Muted, and the stone's trace drawn in Lichen to the right. The whole plate is one link, focused with a Lichen outline.

### Stone plate
The stone screen's one dark plate, under its day in the week row. Svart, 20px/28px inset, a grid: on the left the sport as the page's `h1` (headline), the day and "started 6:40 AM" in Shell Muted (the year only when it isn't this one; the time never wraps), and the week ordinal in Lichen ("2nd stone this week", "last week", or "in the week of 9 Nov"; just after placing it reads "Placed. Your 2nd stone this week" as a live status). Below, the lead figure in display type, then the other figures (moving time, pace or speed, elapsed time) at 1.875rem over a 1px Shell Line rule. On the right, from 1024px, the trace takes 1.25 parts of the width: Lichen, a 3px line, its start marked with a dot, at least 320px tall. A stone with no trace (strength, treadmill, pool) drops the trace column; nothing stands in for it. Under a Monday or Sunday tab the plate's top corner is square, so tab and plate read as one shape.

### Week row
The stone's Mon–Sun week as one row above the plate: the dates in semibold with a "This week"/"Last week" note in Muted Ink, the whole week's totals right-aligned in small body type, then seven day cells 4px apart. Each cell holds its day (short weekday from 640px, narrow on phones, the date number) in caption type and a 16px stitch: Svart at 10% when empty, 4% when still ahead, today outlined 1px Svart, and a day with stones split into each stone's dye. Every other stone is a link (its target reaches 10px above and below the stitch; hover drops it to 75%; focus is the Indigo ring). The stone's own day is a Svart tab (2px top corners) that runs straight into the plate; its stone is marked `aria-current` and not linked, and other stones that day recede to 45% with a Lichen focus outline. Just after placing, the stone's stitch settles into the row with `stone-settle`.

### Lap profile and table
The laps under a "Laps" title over a 1px Svart rule, with the lap count right-aligned, naming the rhythm when the watch lapped at one distance ("13 laps · a lap every 1.00 km"). The profile runs the full width, 112px tall (144px from 640px): a block per lap, width by its share of the distance (of elapsed time when any lap has none), height by its speed against the other laps, filled with the sport's dye, 2px top corners, 2px apart; a lap with no speed is at 40%. Lap numbers sit under it in caption type, every one up to 16 laps, then every 5th or 10th. From 1024px, when the stone has charts, the profile stands upright in the left third beside the charts (two thirds, compact, sticking 24px from the top): a row per lap, top to bottom, sharing the charts' height and never thinner than 6px, the lap number before (caption type, right-aligned) and its pace or speed after; the bar runs from the left, its length by speed, 2px right corners. Over 24 laps only every 5th or 10th row and the active one are named. A caption row heads each column: "Lap" and the pace unit, "Charts" and what they run along. Narrower, the profile runs across as above and the charts sit between it and the table. The table below is a Wool panel with hairline rows, units in the column heads and bare tabular values; elapsed time hides on phones. One active lap is shared: a mouse points, a finger taps (it holds until another is tapped), and the keyboard focuses a row (3px inset Indigo ring). The active lap's block stays full while the others drop to 30%, and its row fills Heather Hover in semibold. In the charts the active lap lights up: either side of it falls under a 75% Heather wash with a 30% Svart hairline at each edge, the lap's stretch of the axis rule thickens to a 3px Svart line, and a Svart chip names it ("Lap 8") under its middle while no cursor is out. The lap holds while the pointer crosses from the laps to the charts, and lets go when the pointer leaves both. A row opens (click, tap, Enter or Space; a chevron before its number turns down) onto its lens, the lap's charts zoomed in on it with 6% of the stone either side, under the same wash; the charts keep the whole stone's range so laps compare, and the axis names its start and end. The lens fills the panel's visible width while the table scrolls sideways under it. The profile is decorative to assistive tech; the table carries the figures. With one lap, the lap is the stone, so there is no profile, only the table (and running form drops its lap table). A stone with no laps says so in Muted Ink: "The watch recorded no laps: this stone keeps its totals only."

### Figure groups
The stone screen's figures (summary, running form, measurements) are grouped by measure, groups 40px apart and wrapping: each group sits under a 4px stitch the width of its figures, in its measure's tint (undyed for temperature, energy and the body), then its figures 24px apart, name in caption Muted Ink over value at 1.25rem, 500 weight.

### Charts
A section's charts stack on one axis, hairlines between them: each a 4px tint stitch and its name (500 weight) with its range in Muted Ink at the other end, over its line (1.5px, its tint) and the area under it (the tint at 10%; elevation at 32%, so it reads as land). A pause breaks the line and the area. Under the last chart, a Svart rule carries the axis: round marks from 0 (every other one on phones) and the end with its unit in ink. One cursor is shared across a section's charts: a mouse points, a finger taps or drags sideways, and the keyboard moves it with the arrow keys once the group (a slider, Indigo ring) has focus, reading out each chart's value. The cursor is a 1px Svart line at 70% with a dot in each tint on its line (Heather ring); each chart's range gives way to its value there in semibold ink, and the axis shows the place in a Svart chip. A tool row heads each group (its name on the left where no section title above names it): on the right, "Drag across to zoom in" in Muted Ink (to a mouse only), and a "Full width" toggle (ghost, xs, `aria-pressed`, Heather Hover when on). A mouse dragging across the charts veils the part under Svart at 8% with 60% Svart edges, thickens its run of the axis rule and names it end to end in the chip; letting go zooms every chart in the group on it (at least 25 m or 10 s), and again within that. The keyboard does the same with Enter at each end; Escape steps back (the mark, the cursor, then the zoom), as do a double click and the row's "Zoom out", beside the part shown. While a part is marked out or zoomed in on, each chart's range gives way to its own Min, Avg and Max (names in Muted Ink, values in ink at 500; the mean is taken along the axis). Clicking or tapping a lap in the profile zooms the charts in on it with the lens's 6% margin and keeps it lit; clicking it again zooms out; pointing only lights. Full width grows the charts out of the column to the window, keeping the page's 32px edge, taller (96px, 128px from 640px, 160px from 1024px); beside the laps the profile runs across above them again, and the charts keep their zoom.

### Splits
The splits table carries a bar per split from 640px, 10px tall in the sport's dye, its length by speed against the other splits, scaled as the lap profile is.

### Stretches
Above the totals, the stretches run as one 16px row of stitches over the elapsed time, each from its start to the next one's: running in the sport's dye, walking in the dye at 45%, standing undyed, with 0:00 and the elapsed time under it. The totals and each row of the table carry the same stitch as a key, and pointing at a row keeps its stitch full while the others fall to 25%.

### Walk
The stone screen ends with the stones either side, two columns from 640px: each neighbour is a Wool panel (hairline, 2px corners) with "← Previous" or "Next →" in caption type, the sport, and its day, time and lead figure; ← and → walk too. Where there is no neighbour, the end takes the empty-state frame at the same size: "Your latest stone", or "No stone in the week before/after" with a link to the calendar.

### Stitch rows
The last 12 weeks knitted as rows in a Wool panel: a table of seven day cells per week, each a 12px-tall stitch with 2px corners. An empty day is Svart at 10%, a day still ahead Svart at 4%, today carries a 1px Svart outline, and a day with stones is filled with each stone's dye, split side by side when there are several. A per-week count sits on the right (Muted Ink when zero). The stitch of the station being pointed at gets a 2px Svart outline.

### Route line
Stones as stations on one line down a 24px gutter. The line is a 4px Svart rule; through a week with no stones it runs as a dotted Field Edge line at 70%. Each week head is an interchange ring (14px, a 3px Svart ring on Heather) on the line, beside the week's dates in semibold, a "This week"/"Last week" note in Muted Ink, and right-aligned totals, over a 1px Svart rule. Each stone is a station: a 20px Wool circle with a 4px ring in its dye, on a row with hairline dividers; on wider screens its figures take fixed right-aligned columns with a small trace at the end, and on phones the lead figure sits beside the name with the rest under it. Hovering or focusing a row tints it with Wool at 70%, fills its station with the dye, and outlines its stitch in the stitch rows (one shared active stone). A stone just placed settles onto the line with `stone-settle` (720ms, from 32px above and 30% opacity, after 280ms; motion-safe only).

### Dialogs
Alert dialogs fade and zoom in from 95% over 150ms on a 50% black scrim (tw-animate-css), with 3px corners and the Dialog shadow. With reduced motion on, they only fade.

## Do's and Don'ts

### Do:
- **Do** put the one forward action in Svart and the alternative in Heather Deep.
- **Do** use Lava, and only Lava, for errors and destructive actions.
- **Do** lift in-flow surfaces by tone (Wool on Heather) and a 1px hairline.
- **Do** show focus on every interactive element: a solid 3px Strength Indigo ring on the light ground, a Lichen outline on Svart.
- **Do** keep inputs at 16px on phones so iOS doesn't zoom.
- **Do** use the drawn wordmark and cairn from `logo/final/`: Basalt with Moss on light, Snow with Lichen on dark.
- **Do** colour a stone by its sport group's dye, and set every figure in tabular numerals.
- **Do** keep corners at 2px on controls and panels, 4px at most anywhere.

### Don't:
- **Don't** use Ember for errors, warnings or anything outside Splitsmith, and never for small text.
- **Don't** use Lichen on the light ground, and don't pair Lichen with Snow outside the logo.
- **Don't** set small text in a dye, or use a dye for anything but a sport group.
- **Don't** put more than one dark plate on a screen below the shell.
- **Don't** add shadows to cards, panels or other in-flow surfaces.
- **Don't** retype VARÐA in a font, or recolour the capstone or the Ð stone.
- **Don't** drift toward a Strava-style feed (bright orange, kudos, leaderboards), Garmin Connect or TrainingPeaks density (walls of dark metric tiles), a stack of identical activity cards, or neutral-gray SaaS.
