/** One lap's bar, as fractions of the strip: its width, and its height. A lap with no speed has a middle height. */
export type LapBar = { width: number; height: number; hasSpeed: boolean };

type StripLap = { distance: number | null; movingTime: number; elapsedTime: number };

// The slowest lap still shows as a bar, and laps all run at one speed (or with none) sit at a middle height.
const shortest = 0.3;
const even = 0.7;

/**
 * The lap strip: one bar per lap. Its width is its share of the distance, or of the elapsed time
 * when any lap has no distance; its height is its speed (by moving time) against the other laps'.
 */
export function lapStrip(laps: StripLap[]): LapBar[] {
  const speeds = laps.map(({ distance, movingTime }) =>
    distance !== null && distance > 0 && movingTime > 0 ? distance / movingTime : null,
  );
  const known = speeds.filter((speed) => speed !== null);
  const [slowest, fastest] = [Math.min(...known), Math.max(...known)];
  const heightOf = (speed: number | null) =>
    speed === null || fastest === slowest
      ? even
      : round(shortest + ((1 - shortest) * (speed - slowest)) / (fastest - slowest));

  const widths = sharesOf(
    laps.every(({ distance }) => distance !== null && distance > 0)
      ? laps.map(({ distance }) => distance ?? 0)
      : laps.map(({ elapsedTime }) => elapsedTime),
  );
  return laps.map((_, i) => {
    const speed = speeds[i] ?? null;
    return { width: widths[i] ?? 0, height: heightOf(speed), hasSpeed: speed !== null };
  });
}

/** Each amount's share of their total, or equal shares when they add up to nothing. */
function sharesOf(amounts: number[]): number[] {
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  return amounts.map((amount) => round(total > 0 ? amount / total : 1 / amounts.length));
}

const round = (fraction: number) => Math.round(fraction * 1000) / 1000;
