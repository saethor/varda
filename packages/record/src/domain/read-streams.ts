// Part of reading a watch file: FIT words (record, timer event, stance time) stay in here.
import type { EventMesg, RecordMesg, SessionMesg } from '@garmin/fitsdk';
import type { Sport } from '@varda/shared';
import type { StreamChannel, Streams } from './stone.ts';

/**
 * The stone's streams: every record the watch wrote, in order, as recorded (never thinned or
 * resampled), or none when it wrote none. `start` is when the session started. A session without
 * distance keeps no distance stream, though its watch may write 0 m at every point.
 */
export function streamsOf(
  { recordMesgs = [], eventMesgs = [] }: { recordMesgs?: RecordMesg[]; eventMesgs?: EventMesg[] },
  { start, sport, session }: { start: Date; sport: Sport; session: SessionMesg },
): Streams | null {
  const points = recordMesgs
    .filter((record): record is RecordMesg & { timestamp: Date } => record.timestamp instanceof Date)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  if (points.length === 0) return null;

  const stops = timerStopsOf(eventMesgs);
  const seconds = points.map(({ timestamp }) => timestamp.getTime() / 1000);
  const hasDistance = Boolean(session.totalDistance);
  const steps = stepsPerMinute.has(sport);

  return {
    offset: seconds.map((at) => at - start.getTime() / 1000),
    // The timer ran up to a point unless it stopped somewhere from the previous point up to just before it.
    timerRunning: seconds.map((at, i) => i === 0 || !stops.some((stop) => stop >= (seconds[i - 1] ?? at) && stop < at)),
    distance: hasDistance ? channel(points, (p) => p.distance) : null,
    speed: hasDistance ? channel(points, (p) => p.enhancedSpeed ?? p.speed) : null,
    heartRate: channel(points, (p) => p.heartRate),
    altitude: channel(points, (p) => p.enhancedAltitude ?? p.altitude),
    power: channel(points, (p) => p.power),
    cadence: channel(points, (p) => cadenceOf(p, steps)),
    temperature: channel(points, (p) => p.temperature),
    position: positionChannel(points),
    stepLength: channel(points, (p) => millimetres(p.stepLength)),
    verticalOscillation: channel(points, (p) => millimetres(p.verticalOscillation)),
    verticalRatio: channel(points, (p) => p.verticalRatio),
    groundContactTime: channel(points, (p) => milliseconds(p.stanceTime)),
  };
}

/** Seconds (Unix) at which the watch's timer stopped. Timer events are the only events read (decision 2). */
function timerStopsOf(events: EventMesg[]): number[] {
  const stopTypes: unknown[] = ['stop', 'stopAll', 'stopDisable', 'stopDisableAll'];
  return events
    .filter((event) => event.event === 'timer' && stopTypes.includes(event.eventType))
    .flatMap(({ timestamp }) => (timestamp instanceof Date ? [timestamp.getTime() / 1000] : []));
}

/** One value per point, or none at all when the watch recorded it at no point. */
function channel(points: RecordMesg[], read: (point: RecordMesg) => unknown): StreamChannel {
  const values = points.map((point) => {
    const value = read(point);
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  });
  return values.some((value) => value !== null) ? values : null;
}

function positionChannel(points: RecordMesg[]): Streams['position'] {
  const positions = points.map(({ positionLat, positionLong }) =>
    typeof positionLat === 'number' && typeof positionLong === 'number'
      ? ([degreesOf(positionLat), degreesOf(positionLong)] as [number, number])
      : null,
  );
  return positions.some((position) => position !== null) ? positions : null;
}

/** FIT stores positions in semicircles: 2^31 of them make 180°. */
const degreesOf = (semicircles: number) => (semicircles * 180) / 2 ** 31;

// Sports whose watch counts cadence per leg; the watch shows them in steps per minute (decision 1).
const stepsPerMinute: ReadonlySet<Sport> = new Set<Sport>([
  'road-running',
  'trail-running',
  'track-running',
  'treadmill-running',
  'walking',
  'hiking',
]);

/** Steps per minute on foot (strides per leg, doubled), as the watch shows it; revolutions per minute otherwise. */
function cadenceOf({ cadence, fractionalCadence }: RecordMesg, steps: boolean): number | null {
  if (typeof cadence !== 'number') return null;
  return steps ? (cadence + (fractionalCadence ?? 0)) * 2 : cadence;
}

const millimetres = (value: unknown) => (typeof value === 'number' ? value / 1000 : null);
const milliseconds = (value: unknown) => (typeof value === 'number' ? value / 1000 : null);
