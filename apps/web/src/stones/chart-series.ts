import type { StoneDetail } from '../lib/stones.ts';

/** A stone's streams: every point its watch recorded, channels as parallel arrays. */
export type Streams = NonNullable<StoneDetail['streams']>;
/** One value per point, `null` where the watch missed one. */
export type Channel = (number | null)[];

/** What a chart runs along: metres from the start, or seconds of moving time for a stone without distance. */
export type ChartAxis = 'distance' | 'moving-time';

/** A point on a chart: where along its axis, and its value. */
export type ChartPoint = [x: number, y: number];

/** Charts run along distance when the watch recorded any, along moving time otherwise. */
export function chartAxisOf({ distance }: Pick<Streams, 'distance'>): ChartAxis {
  return distance?.some((metres) => metres !== null && metres > 0) ? 'distance' : 'moving-time';
}

/** Seconds of moving time at each point: the timer's running time, each pause left out. */
export function movingTimesOf({ offset, timerRunning }: Pick<Streams, 'offset' | 'timerRunning'>): number[] {
  let moving = 0;
  return offset.map((seconds, i) => {
    if (i > 0 && timerRunning[i]) moving += seconds - (offset[i - 1] ?? seconds);
    return moving;
  });
}

/**
 * The lines a chart draws of `values` along `axis`: a point where the timer was paused, or where
 * the watch missed a value, is left out, and the line breaks there.
 */
export function chartSegments(
  streams: Pick<Streams, 'offset' | 'timerRunning' | 'distance'>,
  axis: ChartAxis,
  values: Channel,
): ChartPoint[][] {
  const along = axis === 'distance' ? (streams.distance ?? []) : movingTimesOf(streams);
  const segments: ChartPoint[][] = [];
  let current: ChartPoint[] = [];
  values.forEach((y, i) => {
    const x = along[i];
    if (y === null || x === null || x === undefined || !streams.timerRunning[i]) {
      if (current.length > 0) segments.push(current);
      current = [];
      return;
    }
    current.push([x, y]);
  });
  if (current.length > 0) segments.push(current);
  return segments;
}

/** Pace at each point, in seconds a metre, from speed in metres per second; none when standing still. */
export function paceOf(speed: Channel): Channel {
  return speed.map((metresPerSecond) =>
    metresPerSecond === null || metresPerSecond <= 0 ? null : 1 / metresPerSecond,
  );
}
