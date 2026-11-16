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
} from '@garmin/fitsdk';

/** What a test or the seed can change about a watch file. Everything else is a road run. */
export type WatchFileOptions = {
  /** When the session started (UTC). */
  start?: Date;
  /** Whether the watch recorded GPS positions. `false` is a session indoors: no trace. */
  gps?: boolean;
  /** How many GPS positions the watch recorded, zigzagging along the same route. Default 4. */
  gpsPoints?: number;
};

// Global FIT message numbers (FIT profile).
const fileIdMesg = 0;
const sessionMesg = 18;
const lapMesg = 19;
const recordMesg = 20;
const activityMesg = 34;

/** 1989-12-31T00:00:00Z, the FIT epoch, in Unix seconds. */
const fitEpoch = 631_065_600;
const garmin = 1;
const forerunner255 = 3992;

/** Degrees to FIT semicircles. */
const semicircles = (degrees: number) => Math.round((degrees * 2 ** 31) / 180);

// A road run around Reykjavík's pond: 3 laps of 1 km in 5 minutes each, with 10 s stopped in each lap.
const lap = { distance: 1000, timerTime: 300, elapsedTime: 310 };
const lapCount = 3;
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
  gps = true,
  gpsPoints = route.length,
}: WatchFileOptions = {}): Uint8Array {
  const at = (seconds: number) => new Date(start.getTime() + seconds * 1000);
  const elapsedTime = lap.elapsedTime * lapCount;
  const end = at(elapsedTime);
  const encoder = new Encoder();
  const write = <M extends Mesg>(mesg: Encodable<M>) => encoder.writeMesg(mesg);

  write<FileIdMesg>({
    mesgNum: fileIdMesg,
    type: 'activity',
    manufacturer: garmin,
    product: forerunner255,
    serialNumber: 3_412_345_678,
    timeCreated: end,
  });

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

  for (let i = 0; i < lapCount; i++) {
    write<LapMesg>({
      mesgNum: lapMesg,
      messageIndex: i,
      startTime: at(lap.elapsedTime * i),
      timestamp: at(lap.elapsedTime * (i + 1)),
      totalElapsedTime: lap.elapsedTime,
      totalTimerTime: lap.timerTime,
      totalDistance: lap.distance,
      lapTrigger: 'distance',
      sport: 'running',
    });
  }

  write<SessionMesg>({
    mesgNum: sessionMesg,
    messageIndex: 0,
    startTime: start,
    timestamp: end,
    sport: 'running',
    subSport: 'generic',
    totalElapsedTime: elapsedTime,
    totalTimerTime: lap.timerTime * lapCount,
    totalDistance: lap.distance * lapCount,
    firstLapIndex: 0,
    numLaps: lapCount,
  });

  write<ActivityMesg>({
    mesgNum: activityMesg,
    timestamp: end,
    // Local time as seconds since the FIT epoch, which the encoder only takes as a number.
    localTimestamp: end.getTime() / 1000 - fitEpoch,
    numSessions: 1,
    type: 'manual',
    totalTimerTime: lap.timerTime * lapCount,
  });

  return encoder.close();
}
