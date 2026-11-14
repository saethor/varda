# Varða calculates its own training load

Garmin (and every other platform) reports its own training load, but stones also come from manual entry and, later, from other sources, and the charts Varða exists to provide only work if load is calculated consistently and transparently. Varða therefore calculates its own training load for every stone, the same way whatever the source. Platform-reported load is stored as reference data but never used in Varða's own analysis.

## Consequences

- Manual and corrected stones get a training load like any other.
- Training load depends on the athlete's zones valid on the stone's day, so changing zones never rewrites the load of past stones.
- Which formula to use is still open and will be decided separately.
