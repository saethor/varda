import type { StoneDetail } from '../lib/stones.ts';
import { type Channel, type ChartAxis, type ChartPoint, chartAxisOf, chartSegments, paceOf } from './chart-series.ts';
import { measureOfSport } from './pace-or-speed.ts';

export type ChartKind = 'heart-rate' | 'pace' | 'speed' | 'elevation' | 'power' | 'cadence';

/** One chart: its lines, and whether it is turned over (pace: fewer seconds is faster, drawn higher). */
export type StoneChart = { kind: ChartKind; segments: ChartPoint[][]; invert: boolean; per: 1000 | 100 | null };

/**
 * The charts a stone's streams draw, along distance or, without distance, along moving time, up to
 * `end`: heart rate, pace or speed (the sport's own way of saying how fast), elevation, power and
 * cadence, in that order. A chart the watch recorded nothing for is left out; with none, there are none.
 */
export function stoneCharts({
  sport,
  streams,
}: Pick<StoneDetail, 'sport' | 'streams'>): { axis: ChartAxis; end: number; charts: StoneChart[] } | null {
  if (streams === null) return null;
  const axis = chartAxisOf(streams);
  const measure = measureOfSport(sport.sport);
  const speed = streams.speed;
  const howFast: Omit<StoneChart, 'segments'> & { values: Channel | null } =
    measure === null || speed === null
      ? { kind: 'speed', values: null, invert: false, per: null }
      : measure === 'speed'
        ? { kind: 'speed', values: speed.map((v) => (v === null ? null : v * 3.6)), invert: false, per: null }
        : { kind: 'pace', values: paceOf(speed, measure.pace), invert: true, per: measure.pace };
  const candidates: (Omit<StoneChart, 'segments'> & { values: Channel | null })[] = [
    { kind: 'heart-rate', values: streams.heartRate, invert: false, per: null },
    howFast,
    { kind: 'elevation', values: streams.altitude, invert: false, per: null },
    { kind: 'power', values: streams.power, invert: false, per: null },
    { kind: 'cadence', values: streams.cadence, invert: false, per: null },
  ];
  const charts = candidates.flatMap(({ values, ...chart }) => {
    const segments = values === null ? [] : chartSegments(streams, axis, values);
    return segments.length > 0 ? [{ ...chart, segments }] : [];
  });
  if (charts.length === 0) return null;
  // Points rise along the axis, so each chart ends at its last point.
  const end = charts.reduce((furthest, { segments }) => Math.max(furthest, segments.at(-1)?.at(-1)?.[0] ?? 0), 0);
  return { axis, end, charts };
}
