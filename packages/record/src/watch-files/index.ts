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
};

/** A lap: metres, and seconds of timer and of elapsed time. */
export type WatchFileLap = { distance: number; timerTime: number; elapsedTime: number };

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
const roadRunLap: WatchFileLap = { distance: 1000, timerTime: 300, elapsedTime: 310 };
const roadRunLaps = [roadRunLap, roadRunLap, roadRunLap];
const positions: [number, number][] = [
  [64.1466, -21.9426],
  [64.1452, -21.9391],
  [64.1431, -21.9402],
  [64.1438, -21.9447],
];

/**
 * A FIT activity file as a watch writes it. By default a road run with 3 laps, a few GPS points
 * and a local time offset of 0, started at 2026-11-02 07:30 UTC.
 */
export function watchFile({
  start = new Date('2026-11-02T07:30:00Z'),
  sport = 'running',
  subSport = 'generic',
  laps = roadRunLaps,
  distance,
  localOffset = 0,
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
    type: 'activity',
    manufacturer: garmin,
    product: forerunner255,
    serialNumber: 3_412_345_678,
    timeCreated: end,
  });

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
    startTime: start,
    timestamp: end,
    sport,
    subSport,
    totalElapsedTime: elapsedTime,
    totalTimerTime: total('timerTime'),
    ...metres(total('distance')),
    firstLapIndex: 0,
    numLaps: laps.length,
  });

  write<ActivityMesg>({
    mesgNum: activityMesg,
    timestamp: end,
    // Local time as seconds since the FIT epoch, which the encoder only takes as a number.
    ...(localOffset === null ? {} : { localTimestamp: end.getTime() / 1000 - fitEpoch + localOffset }),
    numSessions: 1,
    type: 'manual',
    totalTimerTime: total('timerTime'),
  });

  return encoder.close();
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
