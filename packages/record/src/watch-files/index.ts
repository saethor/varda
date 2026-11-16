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
  serialNumber = 3_412_345_678,
  timeCreated,
  brokenCrc = false,
  fileType = 'activity',
  multisport = false,
}: WatchFileOptions = {}): Uint8Array {
  const at = (seconds: number) => new Date(start.getTime() + seconds * 1000);
  const elapsedTime = lap.elapsedTime * lapCount;
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
      firstLapIndex: lapCount,
      numLaps: 0,
      ...session,
    });
  });

  write<ActivityMesg>({
    mesgNum: activityMesg,
    timestamp: end,
    // Local time as seconds since the FIT epoch, which the encoder only takes as a number.
    localTimestamp: end.getTime() / 1000 - fitEpoch,
    numSessions: 1 + brick.length,
    type: 'manual',
    totalTimerTime: lap.timerTime * lapCount,
  });

  const bytes = encoder.close();
  // The file's CRC is its last two bytes.
  if (brokenCrc) bytes[bytes.length - 1] = (bytes[bytes.length - 1] ?? 0) ^ 0xff;
  return bytes;
}
