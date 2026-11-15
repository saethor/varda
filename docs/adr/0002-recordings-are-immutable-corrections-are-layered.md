# Recordings are never changed; corrections are layered on top

Watches get things wrong. A treadmill run is the obvious case: the watch says 9.4 km at 4:12/km, but the belt said 10 km at 3:55/km. The athlete must be able to fix a stone's distance, pace and laps. We keep the **recording** (the original watch file or synced data) untouched forever and store **corrections** on top of it. Everywhere else the stone shows its corrected values, marked as corrected, and any correction can be reverted. Only the athlete can correct a stone.

## Considered Options

- **Overwrite the recorded values.** Simpler, but a mistake can't be undone, new metrics can't be recalculated from the original data, and a coach can't see that a stone was edited. That last point goes against the trust the coaching relationship is built on.

## Consequences

- Every derived value (training load, best efforts, the Breakdown) is calculated from the recording with its corrections applied, never from the raw recording alone.
- Correcting a stone's total distance scales its laps proportionally; correcting a lap changes only that lap.
- Best efforts include corrected stones, and the athlete can exclude any single stone from them.
- Deleting a stone is not a correction: it removes the stone, its corrections and its recording entirely, and nothing is kept for anyone, coaches included.
