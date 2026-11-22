// Watch files built in code, so no real FIT file (or real GPS) is ever committed (spec #60).
// Its own subpath, not `./testing`: the seed places stones from these files too.
import {
  type ActivityMesg,
  type Encodable,
  Encoder,
  type FileIdMesg,
  type LapMesg,
  type Mesg,
  type RecordMesg,
  type SessionMesg,
  type UserProfileMesg,
  type ZonesTargetMesg,
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
   * The athlete's measurements the watch had: kilograms, metres, bpm. Each one given is written;
   * by default the watch had none.
   */
  measurements?: Partial<Record<'weight' | 'height' | 'restingHeartRate' | 'maxHeartRate', number>>;
};

/** A lap: metres, and seconds of timer and of elapsed time. */
export type WatchFileLap = { distance: number; timerTime: number; elapsedTime: number };

// Global FIT message numbers (FIT profile).
const fileIdMesg = 0;
const sessionMesg = 18;
const lapMesg = 19;
const recordMesg = 20;
const activityMesg = 34;
const profileMesg = 3;
const zonesTargetMesg = 7;

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
function positionsAlongRoute(count: number): [number, number][] {
  if (count === route.length) return route;
  const legs = route.length - 1;
  return Array.from({ length: count }, (_, i) => {
    const along = (i / (count - 1)) * legs;
    const leg = Math.min(Math.floor(along), legs - 1);
    const t = along - leg;
    const [fromLat, fromLon] = route[leg] as [number, number];
    const [toLat, toLon] = route[leg + 1] as [number, number];
    const zigzag = i === 0 || i === count - 1 ? 0 : (i % 2 === 0 ? 1 : -1) * 0.0003;
    return [fromLat + (toLat - fromLat) * t + zigzag, fromLon + (toLon - fromLon) * t];
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
  measurements = {},
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

  // The watch's profile of the athlete, and its zone settings, which alone hold the max heart rate.
  const { maxHeartRate, ...profile } = measurements;
  if (Object.keys(profile).length > 0) write<UserProfileMesg>({ mesgNum: profileMesg, ...profile });
  if (maxHeartRate !== undefined) write<ZonesTargetMesg>({ mesgNum: zonesTargetMesg, maxHeartRate });

  // Before the watch finds GPS, its records have no position.
  write<RecordMesg>({ mesgNum: recordMesg, timestamp: start, distance: 0 });

  const positions = gps ? positionsAlongRoute(gpsPoints) : [];
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
