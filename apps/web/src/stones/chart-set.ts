import type { StoneDetail } from '../lib/stones.ts';
import { type Channel, type ChartAxis, type ChartPoint, chartAxisOf, chartSegments, paceOf } from './chart-series.ts';
import { measureOfSport } from './pace-or-speed.ts';

export type ChartKind =
  | 'heart-rate'
  | 'pace'
  | 'speed'
  | 'elevation'
  | 'power'
  | 'cadence'
  | 'step-length'
  | 'vertical-oscillation'
  | 'vertical-ratio'
  | 'ground-contact-time';

/** The charts of one section, along the same axis up to the same `end`. */
export type ChartSet = { axis: ChartAxis; end: number; charts: StoneChart[] };

type ChartCandidate = Omit<StoneChart, 'segments'> & { values: Channel | null };

/** One chart: its lines, and whether it is turned over (pace: fewer seconds is faster, drawn higher). */
export type StoneChart = { kind: ChartKind; segments: ChartPoint[][]; invert: boolean; per: 1000 | 100 | null };

/**
 * The charts a stone's streams draw, along distance or, without distance, along moving time, up to
 * `end`: heart rate, pace or speed (the sport's own way of saying how fast), elevation, power and
 * cadence, in that order. A chart the watch recorded nothing for is left out; with none, there are none.
 */
export function stoneCharts({ sport, streams }: Pick<StoneDetail, 'sport' | 'streams'>): ChartSet | null {
  if (streams === null) return null;
  const measure = measureOfSport(sport.sport);
  const speed = streams.speed;
  const howFast: ChartCandidate =
    measure === null || speed === null
      ? { kind: 'speed', values: null, invert: false, per: null }
      : measure === 'speed'
        ? { kind: 'speed', values: speed.map((v) => (v === null ? null : v * 3.6)), invert: false, per: null }
        : { kind: 'pace', values: paceOf(speed, measure.pace), invert: true, per: measure.pace };
  return chartSetOf(streams, [
    { kind: 'heart-rate', values: streams.heartRate, invert: false, per: null },
    howFast,
    { kind: 'elevation', values: streams.altitude, invert: false, per: null },
    { kind: 'power', values: streams.power, invert: false, per: null },
    { kind: 'cadence', values: streams.cadence, invert: false, per: null },
  ]);
}

/**
 * A run's form charts, drawn the same way as `stoneCharts`: step length, vertical oscillation,
 * vertical ratio and ground contact time, in that order, in the contract's SI units. Only a run has
 * them; one the watch recorded nothing for is left out, and with none there are none.
 */
export function formCharts({ sport, streams }: Pick<StoneDetail, 'sport' | 'streams'>): ChartSet | null {
  if (streams === null || sport.group !== 'running') return null;
  return chartSetOf(streams, [
    { kind: 'step-length', values: streams.stepLength, invert: false, per: null },
    { kind: 'vertical-oscillation', values: streams.verticalOscillation, invert: false, per: null },
    { kind: 'vertical-ratio', values: streams.verticalRatio, invert: false, per: null },
    { kind: 'ground-contact-time', values: streams.groundContactTime, invert: false, per: null },
  ]);
}

/** The candidates with something to draw, along the streams' axis; none when none has. */
function chartSetOf(streams: NonNullable<StoneDetail['streams']>, candidates: ChartCandidate[]): ChartSet | null {
  const axis = chartAxisOf(streams);
  const charts = candidates.flatMap(({ values, ...chart }) => {
    const segments = values === null ? [] : chartSegments(streams, axis, values);
    return segments.length > 0 ? [{ ...chart, segments }] : [];
  });
  if (charts.length === 0) return null;
  // Points rise along the axis, so each chart ends at its last point.
  const end = charts.reduce((furthest, { segments }) => Math.max(furthest, segments.at(-1)?.at(-1)?.[0] ?? 0), 0);
  return { axis, end, charts };
}
