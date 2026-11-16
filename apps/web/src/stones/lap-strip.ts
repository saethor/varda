/** One lap's bar, as fractions of the strip: its width, and its height. */
export type LapBar = { width: number; height: number };

// The slowest lap still shows as a bar, and laps all run at one speed sit at a middle height.
const shortest = 0.3;
const even = 0.7;

/**
 * The lap strip: one bar per lap, its width by distance and its height by speed (moving time).
 * None for fewer than two laps, or when a lap has no speed to show.
 */
export function lapStrip(laps: { distance: number | null; movingTime: number }[]): LapBar[] {
  if (laps.length < 2) return [];
  const measured = laps.flatMap(({ distance, movingTime }) =>
    distance !== null && distance > 0 && movingTime > 0 ? [{ distance, speed: distance / movingTime }] : [],
  );
  if (measured.length < laps.length) return [];

  const total = measured.reduce((sum, lap) => sum + lap.distance, 0);
  const speeds = measured.map((lap) => lap.speed);
  const [slowest, fastest] = [Math.min(...speeds), Math.max(...speeds)];
  return measured.map(({ distance, speed }) => ({
    width: round(distance / total),
    height: fastest === slowest ? even : round(shortest + ((1 - shortest) * (speed - slowest)) / (fastest - slowest)),
  }));
}

const round = (fraction: number) => Math.round(fraction * 1000) / 1000;
