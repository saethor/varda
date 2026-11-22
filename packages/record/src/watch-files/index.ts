// Watch files built in code, so no real FIT file (or real GPS) is ever committed (spec #60).
// Its own subpath, not `./testing`: the seed places stones from these files too.
import {
  type ActivityMesg,
  type Encodable,
  Encoder,
  type EventMesg,
  type FileIdMesg,
  type LapMesg,
  type Mesg,
  type RecordMesg,
  type SessionMesg,
} from '@garmin/fitsdk';
import { fitEpoch } from '../domain/read-watch-file.ts';

/** What a test or the seed can change about a watch file. Everything else is a road run. */
export type WatchFileOptions = {
  /** When the session started (UTC). */
  start?: Date;
  /** The watch's serial number; 0 when the watch wrote none. */
  serialNumber?: number;
  /** When the file was written (UTC). By default when the session ended. */
  timeCreated?: Date;
  /** Spoil the file's CRC, as a file damaged on its way off the watch. */
  brokenCrc?: boolean;
  /** What kind of FIT file it is: an activity (a session), or settings, a course, a workout… */
  fileType?: FileIdMesg['type'];
  /** Follow the run with a transition and a ride in the same file, as a brick session. */
  multisport?: boolean;
  /** Whether the watch recorded GPS positions. `false` is a session indoors: no trace. */
  gps?: boolean;
  /** How many GPS positions the watch recorded, zigzagging along the same route. Default 4. */
  gpsPoints?: number;
  /** The FIT sport, as the decoder spells it (`'running'`, `'eBiking'`, …). */
  sport?: SessionMesg['sport'];
  /** The FIT sub-sport, as the decoder spells it (`'trail'`, `'indoorRunning'`, …). */
  subSport?: SessionMesg['subSport'];
  /**
   * The laps the watch wrote, in order. None (`[]`) for a session with totals only, which then
   * lasts as long as the default run.
   */
  laps?: WatchFileLap[];
  /** `false` when the watch recorded no distance, on the session or its laps. */
  distance?: false;
  /**
   * Seconds the watch's local time was ahead of UTC (negative when behind), or `null` for a file
   * with no local time at all.
   */
  localOffset?: number | null;
  /** Leave out when the session started, as a file damaged in a way its CRC doesn't catch. */
  missingStartTime?: true;
  /**
   * Record a point every second the timer runs, as a watch does, instead of a few GPS points: each
   * lap stops halfway for as long as its elapsed time exceeds its timer time, with the watch's timer
   * events around the pause. Every channel a running watch with a power meter records is written
   * (positions only with `gps`, distance 0 throughout with `distance: false`), less those `without`.
   */
  perSecond?: boolean;
  /** With `perSecond`, the channels the watch didn't record. */
  without?: WatchFileChannel[];
  /** Write no records at all, as a session entered on the watch by hand. */
  noRecords?: true;
};

/** The channels `perSecond` writes that a watch may lack (running form is all or nothing). */
export type WatchFileChannel = 'heartRate' | 'altitude' | 'power' | 'cadence' | 'temperature' | 'form';

/** A lap: metres, and seconds of timer and of elapsed time. */
export type WatchFileLap = { distance: number; timerTime: number; elapsedTime: number };

// Global FIT message numbers (FIT profile).
const fileIdMesg = 0;
const sessionMesg = 18;
const lapMesg = 19;
const recordMesg = 20;
const eventMesg = 21;
const activityMesg = 34;

const garmin = 1;
const forerunner255 = 3992;

/** Degrees to FIT semicircles. */
const semicircles = (degrees: number) => Math.round((degrees * 2 ** 31) / 180);

// A road run around Reykjavík's pond: 3 laps of 1 km in 5 minutes each, with 10 s stopped in each lap.
const roadRunLap: WatchFileLap = { distance: 1000, timerTime: 300, elapsedTime: 310 };
const roadRunLaps = [roadRunLap, roadRunLap, roadRunLap];
const route: [number, number][] = [
  [64.146612, -21.942637],
  [64.145218, -21.939108],
  [64.143091, -21.940183],
  [64.143844, -21.944671],
];

/**
 * `count` positions along the route, from its start to its finish. Those in between zigzag
 * about 30 m off it, so simplifying the trace can't drop them as being on a straight line.
 */
function positionsAlongRoute(count: number, zigzag = true): [number, number][] {
  if (count === route.length) return route;
  const legs = route.length - 1;
  return Array.from({ length: count }, (_, i) => {
    const along = (i / (count - 1)) * legs;
    const leg = Math.min(Math.floor(along), legs - 1);
    const t = along - leg;
    const [fromLat, fromLon] = route[leg] as [number, number];
    const [toLat, toLon] = route[leg + 1] as [number, number];
    const off = !zigzag || i === 0 || i === count - 1 ? 0 : (i % 2 === 0 ? 1 : -1) * 0.0003;
    return [fromLat + (toLat - fromLat) * t + off, fromLon + (toLon - fromLon) * t];
  });
}

/**
 * A FIT activity file as a watch writes it. By default a road run with 3 laps, a few GPS points
 * and a local time offset of 0, started at 2026-11-02 07:30 UTC.
 */
export function watchFile({
  start = new Date('2026-11-02T07:30:00Z'),
  serialNumber = 3_412_345_678,
  timeCreated,
  brokenCrc = false,
  fileType = 'activity',
  multisport = false,
  gps = true,
  gpsPoints = route.length,
  sport = 'running',
  subSport = 'generic',
  laps = roadRunLaps,
  distance,
  localOffset = 0,
  missingStartTime,
  perSecond = false,
  without = [],
  noRecords,
}: WatchFileOptions = {}): Uint8Array {
  const at = (seconds: number) => new Date(start.getTime() + seconds * 1000);
  const total = (key: keyof WatchFileLap) => sum((laps.length > 0 ? laps : roadRunLaps).map((lap) => lap[key]));
  // Spread into a message: a field the watch didn't record is left out, never written as 0.
  const metres = (value: number) => (distance === false ? {} : { totalDistance: value });
  const elapsedTime = total('elapsedTime');
  const end = at(elapsedTime);
  const encoder = new Encoder();
  const write = <M extends Mesg>(mesg: Encodable<M>) => encoder.writeMesg(mesg);

  write<FileIdMesg>({
    mesgNum: fileIdMesg,
    type: fileType,
    manufacturer: garmin,
    product: forerunner255,
    serialNumber,
    timeCreated: timeCreated ?? end,
  });

  if (perSecond) {
    const timeline = perSecondTimeline(laps.length > 0 ? laps : roadRunLaps);
    const positions = positionsAlongRoute(timeline.points.length, false);
    for (const { at: seconds, type } of timeline.timer) {
      write<EventMesg>({ mesgNum: eventMesg, timestamp: at(seconds), event: 'timer', eventType: type });
    }
    timeline.points.forEach((point, i) => {
      write<RecordMesg>({
        mesgNum: recordMesg,
        timestamp: at(point.at),
        ...recordedAt(point, {
          sport,
          distance: distance !== false,
          position: gps ? positions[i] : undefined,
          without,
        }),
      });
    });
  }

  // Before the watch finds GPS, its records have no position.
  if (!perSecond && !noRecords) write<RecordMesg>({ mesgNum: recordMesg, timestamp: start, distance: 0 });

  const positions = gps && !perSecond && !noRecords ? positionsAlongRoute(gpsPoints) : [];
  positions.forEach(([lat, lon], i) => {
    write<RecordMesg>({
      mesgNum: recordMesg,
      timestamp: at((elapsedTime * i) / (positions.length - 1)),
      positionLat: semicircles(lat),
      positionLong: semicircles(lon),
    });
  });

  let lapStart = 0;
  laps.forEach((lap, i) => {
    write<LapMesg>({
      mesgNum: lapMesg,
      messageIndex: i,
      startTime: at(lapStart),
      timestamp: at(lapStart + lap.elapsedTime),
      totalElapsedTime: lap.elapsedTime,
      totalTimerTime: lap.timerTime,
      ...metres(lap.distance),
      lapTrigger: 'distance',
      sport,
    });
    lapStart += lap.elapsedTime;
  });

  write<SessionMesg>({
    mesgNum: sessionMesg,
    messageIndex: 0,
    ...(missingStartTime ? {} : { startTime: start }),
    timestamp: end,
    sport,
    subSport,
    totalElapsedTime: elapsedTime,
    totalTimerTime: total('timerTime'),
    ...metres(total('distance')),
    firstLapIndex: 0,
    numLaps: laps.length,
  });

  // A brick: the run, a transition, then a ride with no laps of its own.
  const brick: (Pick<SessionMesg, 'sport' | 'totalElapsedTime' | 'totalTimerTime' | 'totalDistance'> & {
    startTime: Date;
    totalElapsedTime: number;
  })[] = multisport
    ? [
        { sport: 'transition', startTime: end, totalElapsedTime: 60, totalTimerTime: 60, totalDistance: 0 },
        {
          sport: 'cycling',
          startTime: at(elapsedTime + 60),
          totalElapsedTime: 600,
          totalTimerTime: 600,
          totalDistance: 5000,
        },
      ]
    : [];
  brick.forEach((session, i) => {
    write<SessionMesg>({
      mesgNum: sessionMesg,
      messageIndex: i + 1,
      timestamp: new Date(session.startTime.getTime() + session.totalElapsedTime * 1000),
      firstLapIndex: laps.length,
      numLaps: 0,
      ...session,
    });
  });

  write<ActivityMesg>({
    mesgNum: activityMesg,
    timestamp: end,
    // Local time as seconds since the FIT epoch, which the encoder only takes as a number.
    ...(localOffset === null ? {} : { localTimestamp: end.getTime() / 1000 - fitEpoch + localOffset }),
    numSessions: 1 + brick.length,
    type: 'manual',
    totalTimerTime: total('timerTime'),
  });

  const bytes = encoder.close();
  // The file's CRC is its last two bytes.
  if (brokenCrc) bytes[bytes.length - 1] = (bytes[bytes.length - 1] ?? 0) ^ 0xff;
  return bytes;
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** A point a per-second watch writes: seconds from the start, metres from the start, and whether it ends a pause. */
type TimelinePoint = { at: number; metres: number; moving: number; restart: boolean };

/**
 * A record every second of each lap, stopping halfway through the lap for as long as its elapsed
 * time exceeds its timer time. A watch writes a record when its timer stops and one when it starts
 * again, at the same distance, and none in between.
 */
function perSecondTimeline(laps: WatchFileLap[]): {
  points: TimelinePoint[];
  timer: { at: number; type: 'start' | 'stop' | 'stopAll' }[];
} {
  const points: TimelinePoint[] = [];
  const timer: { at: number; type: 'start' | 'stop' | 'stopAll' }[] = [{ at: 0, type: 'start' }];
  let lapStart = 0;
  let lapMetres = 0;
  let moving = 0;
  for (const lap of laps) {
    const pause = lap.elapsedTime - lap.timerTime;
    const stopAt = lapStart + Math.floor(lap.timerTime / 2);
    const restartAt = stopAt + pause;
    if (pause > 0) timer.push({ at: stopAt, type: 'stop' }, { at: restartAt, type: 'start' });
    for (let at = points.length === 0 ? lapStart : lapStart + 1; at <= lapStart + lap.elapsedTime; at++) {
      if (pause > 0 && at > stopAt && at < restartAt) continue;
      const restart = pause > 0 && at === restartAt;
      if (at > lapStart && !restart) moving++;
      const inLap = at <= stopAt ? at - lapStart : at - lapStart - pause;
      points.push({ at, metres: lapMetres + (lap.distance * inLap) / lap.timerTime, moving, restart });
    }
    lapStart += lap.elapsedTime;
    lapMetres += lap.distance;
  }
  timer.push({ at: lapStart, type: 'stopAll' });
  return { points, timer };
}

/**
 * What a watch records at a point: a steady runner whose heart rate drifts up over the session, on
 * gently rolling ground, on a cool morning. Values are physical; the encoder scales them.
 */
function recordedAt(
  { metres, moving, restart }: TimelinePoint,
  {
    sport,
    distance,
    position,
    without,
  }: {
    sport: SessionMesg['sport'];
    distance: boolean;
    position: [number, number] | undefined;
    without: WatchFileChannel[];
  },
): Omit<RecordMesg, 'timestamp'> {
  const has = (channel: WatchFileChannel) => !without.includes(channel);
  const onFoot = sport === 'running' || sport === 'walking' || sport === 'hiking';
  const speed = restart ? 0 : distance ? 1000 / 300 : 0;
  return {
    distance: distance ? metres : 0,
    ...(distance ? { enhancedSpeed: speed } : {}),
    ...(position ? { positionLat: semicircles(position[0]), positionLong: semicircles(position[1]) } : {}),
    ...(has('heartRate') ? { heartRate: Math.round(138 + moving / 40 + 3 * Math.sin(moving / 25)) } : {}),
    ...(has('altitude') ? { enhancedAltitude: 20 + 8 * Math.sin(metres / 400) } : {}),
    ...(has('power') ? { power: Math.round(255 + 12 * Math.sin(moving / 9)) } : {}),
    ...(has('cadence') ? (onFoot ? { cadence: 85, fractionalCadence: 0.5 } : { cadence: 85 }) : {}),
    ...(has('temperature') ? { temperature: 8 + Math.floor(moving / 600) } : {}),
    ...(has('form') ? { stepLength: 1170, verticalOscillation: 85, verticalRatio: 7.3, stanceTime: 245 } : {}),
  };
}
