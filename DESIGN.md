---
name: Varða
description: A training diary built around the journey. Calm highland earth, one stone at a time.
colors:
  basalt: "#2b2e2f"
  snow: "#f3f1ec"
  ash-card: "#faf9f6"
  weathered-stone: "#ebe7dd"
  pale-scree: "#d8d3c7"
  scree: "#8f8878"
  tephra: "#6f695d"
  deep-moss: "#4f6841"
  moss: "#5e7a4e"
  lichen: "#b5c26a"
  ember: "#e0662a"
  lava: "#8c2f39"
typography:
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
    fontWeight: 500
    lineHeight: "1rem"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  tight: "8px"
  snug: "12px"
  base: "16px"
  section: "24px"
  field: "28px"
  page: "32px"
components:
  button-primary:
    backgroundColor: "{colors.deep-moss}"
    textColor: "{colors.snow}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.weathered-stone}"
    textColor: "{colors.basalt}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.snow}"
    textColor: "{colors.basalt}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.lichen}"
    textColor: "{colors.basalt}"
  button-destructive:
    backgroundColor: "{colors.lava}"
    textColor: "{colors.snow}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  input:
    textColor: "{colors.basalt}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  card:
    backgroundColor: "{colors.ash-card}"
    textColor: "{colors.basalt}"
    rounded: "{rounded.xl}"
    padding: "24px"
  badge-outline:
    textColor: "{colors.basalt}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  alert-destructive:
    backgroundColor: "{colors.ash-card}"
    textColor: "{colors.lava}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  nav-link:
    textColor: "{colors.tephra}"
    typography: "{typography.body}"
  nav-link-active:
    textColor: "{colors.basalt}"
---

# Design System: Varða

## Overview

**Creative North Star: "The Highland Waymark"**

A varða is a pile of stones on an open, pale highland. You can see it from far off because almost nothing else is there. Varða's interface works the same way: calm, earthy marks on a quiet field of snow, where each mark has earned its place the way a cairn has on a long route. The mood is calm, earthy, reflective and precise. Splitsmith, the planning area, brings the heat of the forge with Ember. Varða itself stays cool and mossy.

The system is a warm-stone retune of shadcn/ui (new-york). The defaults have been moved off neutral gray onto basalt, snow and moss, and the restraint is deliberate. Density is low and the pace is unhurried: one narrow column, generous gaps, and one clear action per moment. Depth is tonal, not lifted. The brand mostly shows in the palette, the cairn mark and the vocabulary, not in ornament. Brand moments can get bolder, but working screens should feel like a well-kept field notebook.

Rejected: a Strava-style social feed (bright orange, kudos, leaderboards), Garmin Connect or TrainingPeaks density (dark panels, walls of metric tiles), and generic neutral-gray shadcn SaaS.

**Key Characteristics:**
- Snow ground, basalt ink, deep-moss action, lichen as the light touch.
- Flat and tonal: Ash Card lifts off Snow by value, with a hairline Pale Scree border.
- One narrow, centred column on every screen today (28rem).
- The system sans at small sizes. Hierarchy comes from weight and a few steps of scale.
- Light only. There is no dark mode.

## Colors

The palette comes from the Icelandic highlands: volcanic rock, old snow, moss, lichen, ember and lava. Every neutral is warmed toward ash, never cooled toward gray.

### Primary
- **Deep Moss** (`deep-moss`): the primary action colour. It fills primary buttons, in-sentence links, selected field options (at 5% tint) and text selection. It is darker than brand Moss so that Snow text on it clears AA (5.5:1).
- **Moss** (`moss`): the brand green from the logo and the focus ring colour. Do not put text on it: Snow on Moss is only 4.26:1.

### Secondary
- **Lichen** (`lichen`): the accent. It is the hover fill for ghost and outline buttons and outline badge links, always with Basalt text (7.1:1). In the logo it is the capstone colour on dark backgrounds.

### Tertiary
- **Ember** (`ember`): Splitsmith's forge accent, reserved for the planning area. Snow on Ember is 3.05:1 and Basalt on Ember is 3.98:1, so Ember is for fills, marks and large type only, never small text.

### Neutral
- **Basalt** (`basalt`): all ink, meaning body text, headings and card text. It reads 12.1:1 on Snow.
- **Snow** (`snow`): the page background, and the text on Deep Moss and Lava fills.
- **Ash Card** (`ash-card`): cards, popovers and alerts, one step lighter than Snow so they lift by value.
- **Weathered Stone** (`weathered-stone`): secondary button fills and muted surfaces.
- **Pale Scree** (`pale-scree`): every border, divider and separator.
- **Scree** (`scree`): input borders, darker than Pale Scree so fields read as fields (3.1:1 on Snow, which meets the non-text minimum).
- **Tephra** (`tephra`): muted text, meaning descriptions, the tagline, placeholders and inactive nav (4.8:1 on Snow, 5.2:1 on Ash Card).

### Error
- **Lava** (`lava`): errors and destructive actions only. It is the text colour of destructive alerts and field errors, and the fill of destructive buttons (7.7:1 on Ash Card).

### Named Rules
**The Lava, Never Ember Rule.** Errors are Lava. Ember belongs to Splitsmith's forge and never signals a problem.

**The Logo Pairing Rule.** On light backgrounds the cairn and wordmark are Basalt with a Moss accent. On dark backgrounds they are Snow with a Lichen accent. Never mix the pairs, for example Lichen on Snow.

**The Warm Neutral Rule.** No cool or pure grays. Every new neutral sits on the ash hue (about 85–90° in OKLCH) like the existing ramp.

## Typography

**Body Font:** the system sans (`ui-sans-serif, system-ui, sans-serif`)
**Brand type:** the VARÐA wordmark and the tagline are drawn as vector shapes in `logo/final/`, not set in a font.

**Character:** Plain and native. The system face keeps working screens quiet and fast in both English and Icelandic, and the logo carries the personality.

### Hierarchy
- **Headline** (`headline`): the one page heading, an `h1` inside the card title (for example "Sign in", "Hi, {name}").
- **Title** (`title`): dialog titles.
- **Body** (`body`): descriptions, nav links, alerts, field help and errors. The document base is 16px, and inputs use 16px on phones (so iOS doesn't zoom) and drop to 14px from 768px.
- **Label** (`label`): field labels, buttons and card titles at the base size.
- **Caption** (`caption`): badges such as "Last used", and developer tooling.

### Named Rules
**The Two-Language Rule.** Every label must fit in both English and Icelandic. Icelandic words run long, so never set fixed widths on text-bearing controls and never truncate a label to make it fit.

## Layout

Today every screen is one centred column, at most 28rem wide, with 32px padding and a 24px gap between its blocks: the brand header, the nav, then a card. Inside a card, content insets 24px and fields stack 28px apart. Inline groups (nav links, a button with its badge) sit 16px apart, and tight pairs 8px apart. Spacing follows Tailwind's 4px step.

Phones are the first scene: placing a stone right after a session. The column already fits a phone, and dialogs keep 16px clear of the screen edges. Dialog footers stack their buttons on phones (primary on top) and lay them out in a row, aligned right, from 640px. The planning and analysis screens on desktop (journey, stages, the Path) do not exist yet. When they arrive, widen the layout for those screens and leave the narrow column for the focused, one-action screens.

Lists inside a card are a single bordered block with hairline dividers between rows (12px × 16px row padding), not separate cards.

## Elevation & Depth

Flat and tonal. Surfaces separate by value (Ash Card on Snow, Weathered Stone fills) and by a hairline Pale Scree border, not by shadow. Shadows are only for things that float above the page: dialogs, and the dev menu pinned to a corner. Outline buttons and inputs carry an almost invisible `shadow-xs` lip that comes from shadcn.

### Shadow Vocabulary
- **Lip** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): outline buttons and inputs only.
- **Float** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): small overlays fixed to the viewport (the dev menu).
- **Dialog** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): alert dialogs, over a 50% black scrim.

### Named Rules
**The Lift-By-Value Rule.** A surface in the page flow is lifted by a lighter tone and a hairline, never by a shadow. If it doesn't float over something, it gets no shadow. That includes cards, which drop shadcn's default `shadow-sm`.

## Shapes

Gently rounded and consistent, echoing the cairn's stones (4-unit corners on 20-unit-tall stones). Controls (buttons, inputs, badges, bordered lists) use 6px. Alerts and dialogs use 8px. Cards are the softest at 12px. Native leftovers such as the dev menu's select use 4px. Borders are 1px hairlines in Pale Scree, or Scree on inputs. There is no pill shape, and stones in the logo are never re-spaced or re-proportioned in UI.

## Components

Quiet and sure-footed: plain shapes, one clear action, and states that answer at once without fuss.

### Buttons
- **Shape:** gently rounded (6px), 36px tall by default. There are also 24px (xs), 32px (sm) and 40px (lg) sizes, and square icon sizes to match.
- **Primary:** Deep Moss fill with Snow label at 500 weight. Hover drops the fill to 90% opacity. Use it for the one forward action on a screen.
- **Secondary:** a Weathered Stone fill with Basalt label. Hover takes it to 80%. Use it for the alternative route (sign in with a passkey, sign out).
- **Outline / Ghost:** an outline button is Snow with a Pale Scree hairline and a Lip shadow, and a ghost button is bare. Both fill with Lichen on hover.
- **Destructive:** a Lava fill with Snow label.
- **Link:** Deep Moss text that underlines on hover. Links inside running text are always underlined (4px offset, 500 weight).
- **Focus:** a solid 3px Moss ring on `:focus-visible`. **Disabled:** 50% opacity, with no pointer events.

### Chips (Badges)
- **Style:** 6px corners, 2px × 8px padding, caption type. Outline badges are Basalt text on a Pale Scree hairline. Filled badges use Deep Moss, Weathered Stone or Lava.
- **Use:** small status notes pinned to a control, such as "Last used" sitting on the top edge of its button on a Snow backing.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** Ash Card with Basalt text.
- **Shadow Strategy:** none by the Lift-By-Value Rule (see Elevation & Depth).
- **Border:** a Pale Scree hairline.
- **Internal Padding:** 24px around content, with a 24px gap between header, content and footer.

### Inputs / Fields
- **Style:** a transparent fill with a Scree hairline, 6px corners and 36px height, 12px side padding, and Tephra placeholder text.
- **Focus:** the border turns Moss, with a solid 3px Moss ring.
- **Error:** the border and ring turn Lava, the field's label turns Lava, and a Lava message appears below. Server-found problems replace the field's own message rather than stacking on it.
- **Disabled:** 50% opacity.
- **Field group:** label, control and message stack 12px apart, and fields sit 28px apart.

### Alerts
- **Style:** Ash Card fill, Pale Scree hairline, 8px corners, 12px × 16px padding, body type.
- **Destructive:** Lava text on Ash Card, not a Lava fill. The problem is named calmly, without alarm.

### Navigation
- **Style:** a row of body-size text links 16px apart under the brand header. Inactive links are Tephra and turn Basalt on hover. The active link is Basalt. No underline, pill or background marks the active state.
- **Mobile:** the same row. It has two links today.

### Brand Header
The brand sits at the top of the column: the drawn VARÐA wordmark (24px tall, `alt="Varða"`), with the tagline "One stone at a time." 8px below it in Tephra. The tagline is translated text, not the outlined tagline from the logo files, so it reads in Icelandic too. The wordmark is `apps/web/src/assets/varda-wordmark.svg`, a copy of `logo/final/varda-wordmark.svg` cropped to the letters. Below about 24px tall, use the cairn mark instead.

### Dialogs
Alert dialogs fade and zoom in from 95% over 150ms on a 50% black scrim (tw-animate-css). With reduced motion on, they only fade.

## Do's and Don'ts

### Do:
- **Do** put the one forward action in Deep Moss and the alternative in Weathered Stone.
- **Do** use Lava, and only Lava, for errors and destructive actions.
- **Do** lift in-flow surfaces by tone (Ash Card on Snow) and a Pale Scree hairline.
- **Do** show focus as a solid 3px Moss ring on every interactive element.
- **Do** keep inputs at 16px on phones so iOS doesn't zoom.
- **Do** use the drawn wordmark and cairn from `logo/final/`, Basalt with Moss on light and Snow with Lichen on dark.
- **Do** keep new neutrals on the warm ash hue.

### Don't:
- **Don't** use Ember for errors, warnings or anything outside Splitsmith, and never for small text.
- **Don't** put text on brand Moss. Use Deep Moss for fills behind text.
- **Don't** add shadows to cards or other in-flow surfaces.
- **Don't** retype VARÐA in a font, or recolour the capstone or the Ð stone.
- **Don't** pair Lichen with Snow.
- **Don't** drift toward a Strava-style feed (bright orange, kudos, leaderboards), Garmin Connect or TrainingPeaks density (dark panels, walls of metric tiles), or neutral-gray SaaS.
- **Don't** use cool or pure grays.
