import type { Sport, StoneDetail } from '../lib/stones.ts';
import { type Channel, type ChartAxis, type ChartPoint, chartAxisOf, chartSegments, paceOf } from './chart-series.ts';
import { howFastOf } from './pace-or-speed.ts';

/** What a chart draws. A pace chart says what distance its pace is over, as its sport talks. */
export type ChartKind =
  | 'heart-rate'
  | 'pace-per-kilometre'
  | 'pace-per-100-metres'
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

type ChartCandidate = { kind: ChartKind; values: Channel | null };

/**
 * One chart: its lines, its values in SI units as the contract gives them (a pace in seconds a
 * metre), and whether it is turned over (pace: fewer seconds is faster, drawn higher).
 */
export type StoneChart = { kind: ChartKind; segments: ChartPoint[][]; invert: boolean };

/**
 * The charts a stone's streams draw, along distance or, without distance, along moving time, up to
 * `end`: heart rate, pace or speed (the sport's own way of saying how fast), elevation, power and
 * cadence, in that order. A chart the watch recorded nothing for is left out; with none, there are none.
 */
export function stoneCharts({ sport, streams }: Pick<StoneDetail, 'sport' | 'streams'>): ChartSet | null {
  if (streams === null) return null;
  return chartSetOf(streams, [
    { kind: 'heart-rate', values: streams.heartRate },
    howFastChart(sport.sport, streams.speed),
    { kind: 'elevation', values: streams.altitude },
    { kind: 'power', values: streams.power },
    { kind: 'cadence', values: streams.cadence },
  ]);
}

/** Pace over the sport's distance, or speed, from the speed stream; nothing for a sport that talks of neither. */
function howFastChart(sport: Sport, speed: Channel | null): ChartCandidate {
  const howFast = howFastOf(sport);
  if (howFast === null || speed === null) return { kind: 'speed', values: null };
  if (howFast.measure === 'speed') return { kind: 'speed', values: speed };
  return { kind: howFast.per === 'kilometre' ? 'pace-per-kilometre' : 'pace-per-100-metres', values: paceOf(speed) };
}

/**
 * A run's form charts, drawn the same way as `stoneCharts`: step length, vertical oscillation,
 * vertical ratio and ground contact time, in that order, in the contract's SI units. Only a run has
 * them; one the watch recorded nothing for is left out, and with none there are none.
 */
export function formCharts({ sport, streams }: Pick<StoneDetail, 'sport' | 'streams'>): ChartSet | null {
  if (streams === null || sport.group !== 'running') return null;
  return chartSetOf(streams, [
    { kind: 'step-length', values: streams.stepLength },
    { kind: 'vertical-oscillation', values: streams.verticalOscillation },
    { kind: 'vertical-ratio', values: streams.verticalRatio },
    { kind: 'ground-contact-time', values: streams.groundContactTime },
  ]);
}

/** A pace chart is turned over: fewer seconds is faster, drawn higher. */
const inverted: ReadonlySet<ChartKind> = new Set<ChartKind>(['pace-per-kilometre', 'pace-per-100-metres']);

/** The candidates with something to draw, along the streams' axis; none when none has. */
function chartSetOf(streams: NonNullable<StoneDetail['streams']>, candidates: ChartCandidate[]): ChartSet | null {
  const axis = chartAxisOf(streams);
  const charts = candidates.flatMap(({ kind, values }) => {
    const segments = values === null ? [] : chartSegments(streams, axis, values);
    return segments.length > 0 ? [{ kind, segments, invert: inverted.has(kind) }] : [];
  });
  if (charts.length === 0) return null;
  // Points rise along the axis, so each chart ends at its last point.
  const end = charts.reduce((furthest, { segments }) => Math.max(furthest, segments.at(-1)?.at(-1)?.[0] ?? 0), 0);
  return { axis, end, charts };
}
