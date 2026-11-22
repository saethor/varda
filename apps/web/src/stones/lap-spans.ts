import type { StoneDetail } from '../lib/stones.ts';
import { type ChartAxis, movingTimesOf } from './chart-series.ts';

/** Where along a chart's axis something runs: metres from the start, or seconds of moving time. */
export type Span = [from: number, to: number];

type SpanStone = Pick<StoneDetail, 'start' | 'laps' | 'streams'>;

/**
 * Where each lap runs along the charts' axis, from the streams: from the point its start falls on
 * to the point the next lap's start does (the last lap to the last point). None without streams.
 */
export function lapSpans(stone: SpanStone, axis: ChartAxis): Span[] | null {
  const { streams } = stone;
  if (streams === null || streams.offset.length === 0) return null;
  const along = alongOf(streams, axis);
  const startOf = (date: Date) => (date.getTime() - stone.start.getTime()) / 1000;
  // The first point at or after `seconds` from the stone's start; the last point past the end.
  const pointAt = (seconds: number) => {
    let [lo, hi] = [0, streams.offset.length];
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if ((streams.offset[mid] ?? 0) < seconds) lo = mid + 1;
      else hi = mid;
    }
    return Math.min(lo, streams.offset.length - 1);
  };
  return stone.laps.map((lap, i) => {
    const next = stone.laps[i + 1];
    const from = along[pointAt(startOf(lap.start))] ?? 0;
    const to = next === undefined ? (along.at(-1) ?? from) : (along[pointAt(startOf(next.start))] ?? from);
    return [from, Math.max(from, to)];
  });
}

/** A span with a little of either side of it, so its edges show, kept within 0 and `end`. */
export function spanWithMargin([from, to]: Span, end: number, share = 0.06): Span {
  const margin = (to - from) * share;
  return [Math.max(0, from - margin), Math.min(end, to + margin)];
}

/** Each point's place along the axis, a missed distance carrying the last one known. */
function alongOf(streams: NonNullable<SpanStone['streams']>, axis: ChartAxis): number[] {
  if (axis === 'moving-time') return movingTimesOf(streams);
  let known = 0;
  return (streams.distance ?? []).map((metres) => {
    if (metres !== null) known = metres;
    return known;
  });
}
