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

/** `xMin` (0 unless a chart is zoomed in on part of its axis) to `xMax` across the box's width. */
type Box = { width: number; height: number; xMin?: number; xMax: number; domain: [number, number]; invert?: boolean };

/**
 * The SVG path of a chart's lines in a `width` × `height` box, `x` from 0 to `xMax` and values from
 * `domain`'s low (bottom) to high (top), or turned over with `invert`. Points in the same column are
 * averaged, so a stone of hours draws no more points than the box is wide; values outside the range
 * sit on its edge.
 */
export function chartPath(segments: ChartPoint[][], box: Box): string {
  return boxSegments(segments, box)
    .map((points) => points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(''))
    .join('');
}

/** The area under each of a chart's lines, down to the bottom of the box: the line's path, closed. */
export function chartArea(segments: ChartPoint[][], box: Box): string {
  return boxSegments(segments, box)
    .map((points) => {
      const first = points[0];
      const last = points.at(-1);
      if (first === undefined || last === undefined) return '';
      const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join('');
      return `${line}L${last[0]} ${box.height}L${first[0]} ${box.height}Z`;
    })
    .join('');
}

/** A chart's segments as points in the box, a column apiece. */
function boxSegments(
  segments: ChartPoint[][],
  { width, height, xMin = 0, xMax, domain: [low, high], invert = false }: Box,
): ChartPoint[][] {
  const xOf = (x: number) => (xMax > xMin ? ((x - xMin) / (xMax - xMin)) * width : 0);
  const yOf = (y: number) => {
    const share = Math.min(1, Math.max(0, (y - low) / (high - low)));
    return (invert ? share : 1 - share) * height;
  };
  return segments.map((segment) =>
    columnsOf(segment.map(([x, y]): ChartPoint => [Math.round(xOf(x)), y])).map(([x, y]) => [x, round(yOf(y))]),
  );
}

/**
 * A chart's value at `x` along its axis: the recorded point nearest it, or none where the line is
 * broken (a pause, or values the watch missed) or `x` is past either end.
 */
export function chartValueAt(segments: ChartPoint[][], x: number): number | null {
  for (const segment of segments) {
    const first = segment[0];
    const last = segment.at(-1);
    if (first === undefined || last === undefined || x < first[0] || x > last[0]) continue;
    let [lo, hi] = [0, segment.length - 1];
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if ((segment[mid]?.[0] ?? 0) <= x) lo = mid;
      else hi = mid;
    }
    const [a, b] = [segment[lo], segment[hi]];
    if (a === undefined || b === undefined) return null;
    return x - a[0] <= b[0] - x ? a[1] : b[1];
  }
  return null;
}

/**
 * Where to mark a chart's axis, from 0 to `end`: a round step that leaves at most `most` marks
 * (metres, or seconds of moving time), not counting the end itself.
 */
export function axisTicks(end: number, steps: number[], most = 7, start = 0): number[] {
  const span = end - start;
  const step = steps.find((each) => span / each <= most) ?? steps.at(-1) ?? span;
  const ticks: number[] = [];
  // From `start` the marks fall on the step's round numbers, none hard against either end.
  const first = start === 0 ? 0 : Math.ceil((start + step * 0.1) / step) * step;
  for (let at = first; at < end - step * 0.25; at += step) ticks.push(at);
  return ticks;
}

/**
 * A chart's lines cut to `[from, to]` along its axis, keeping the point either side of the cut so
 * each line still runs to the edge. Segments wholly outside are left out.
 */
export function chartWindow(segments: ChartPoint[][], [from, to]: [number, number]): ChartPoint[][] {
  return segments.flatMap((segment) => {
    const first = segment[0];
    const last = segment.at(-1);
    if (first === undefined || last === undefined || last[0] < from || first[0] > to) return [];
    const inside = segment.findIndex(([x]) => x >= from);
    const past = segment.findIndex(([x]) => x > to);
    return [segment.slice(Math.max(0, inside - 1), past === -1 ? segment.length : past + 1)];
  });
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
