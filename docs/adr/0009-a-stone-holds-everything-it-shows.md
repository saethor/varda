# A stone holds everything it shows, read once when it is placed

The stone screen shows summary numbers, richer laps, splits, stretches, running form and charts drawn from per-second data. We read all of it from the recording once, when the stone is placed, and store it on the stone; the stone screen never reads a recording. Stones will also come from synced platforms and manual entry, and each source must produce the same stone rather than every screen learning every source's format. The per-second streams are kept at one point per second, as recorded, not thinned for charts, so nothing shown is less accurate than the watch.

## Considered Options

- **Re-read the recording whenever a stone is opened.** No extra storage, but every screen would need a reader for every source, and the watch file's own words would leak out of the code that reads it.

## Consequences

- Adding a new kind of data to stones means re-reading the existing recordings once; this is possible because recordings are never changed (ADR 0002).
- Each stone stores thousands of points per stream, so how streams are stored has to be chosen with that size in mind.
- A correction to a stone's distance scales its splits and distance stream by the same factor as its laps (ADR 0002).
- Garmin's own verdicts (training load, Training Effect) are stored with the stone as reference data but never shown (ADR 0003).
