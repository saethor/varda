import type { ChartPoint } from './chart-series.ts';

/** The share of values left out at each end of a chart's range, so a wild second doesn't flatten the line. */
const spikeShare = 0.02;

/**
 * The lowest and highest values a chart shows: its values without the odd spike at either end, or
 * none when there are no values. A flat line is opened out by one either side.
 */
export function chartDomain(segments: ChartPoint[][]): [number, number] | null {
  const values = segments
    .flat()
    .map(([, y]) => y)
    .sort((a, b) => a - b);
  if (values.length === 0) return null;
  const at = (share: number) => values[Math.round(share * (values.length - 1))] ?? 0;
  const [low, high] = [at(spikeShare), at(1 - spikeShare)];
  return low === high ? [low - 1, high + 1] : [low, high];
}

/**
 * The SVG path of a chart's lines in a `width` × `height` box, `x` from 0 to `xMax` and values from
 * `domain`'s low (bottom) to high (top), or turned over with `invert`. Points in the same column are
 * averaged, so a stone of hours draws no more points than the box is wide; values outside the range
 * sit on its edge.
 */
export function chartPath(
  segments: ChartPoint[][],
  {
    width,
    height,
    xMax,
    domain: [low, high],
    invert = false,
  }: { width: number; height: number; xMax: number; domain: [number, number]; invert?: boolean },
): string {
  const xOf = (x: number) => (xMax > 0 ? (x / xMax) * width : 0);
  const yOf = (y: number) => {
    const share = Math.min(1, Math.max(0, (y - low) / (high - low)));
    return (invert ? share : 1 - share) * height;
  };
  return segments
    .map((segment) =>
      columnsOf(segment.map(([x, y]): ChartPoint => [Math.round(xOf(x)), y]))
        .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${round(yOf(y))}`)
        .join(''),
    )
    .join('');
}

/** Points sharing a column, averaged into one. */
function columnsOf(points: ChartPoint[]): ChartPoint[] {
  const columns: { x: number; sum: number; count: number }[] = [];
  for (const [x, y] of points) {
    const last = columns.at(-1);
    if (last?.x === x) {
      last.sum += y;
      last.count++;
    } else columns.push({ x, sum: y, count: 1 });
  }
  return columns.map(({ x, sum, count }) => [x, sum / count]);
}

const round = (value: number) => Math.round(value * 10) / 10;
