import type { ContractRouterClient } from '@orpc/contract';
import { safe } from '@orpc/server';
import type { Contract } from '@varda/contract';
import { type WatchFileFigures, type WatchFileLap, type WatchFileOptions, watchFile } from '@varda/record/watch-files';

/** `count` laps of `distance` metres in `timerTime` seconds, each with 10 s stopped. */
const laps = (count: number, distance: number, timerTime: number): WatchFileLap[] =>
  Array.from({ length: count }, () => ({ distance, timerTime, elapsedTime: timerTime + 10 }));

/** Track intervals: fast 400s with slow 200s between them. */
const intervals = Array.from({ length: 5 }, () => [...laps(1, 400, 80), ...laps(1, 200, 75)]).flat();

/**
 * The stones every dev person gets: how many days before today, a UTC start time, and the watch
 * file. A few sports, with and without laps; those indoors or in a pool have no GPS, so no trace.
 * One was run abroad, late in the evening there, past midnight in UTC.
 */
const devStones: { daysAgo: number; time: string; file: WatchFileOptions }[] = [
  { daysAgo: 1, time: '06:40', file: {} },
  { daysAgo: 3, time: '17:15', file: { subSport: 'track', laps: intervals } },
  { daysAgo: 5, time: '09:00', file: { subSport: 'trail', laps: laps(2, 5000, 1800) } },
  { daysAgo: 7, time: '17:30', file: { sport: 'cycling', subSport: 'road', laps: laps(2, 15_000, 1800) } },
  {
    daysAgo: 9,
    time: '12:10',
    file: { sport: 'training', subSport: 'strengthTraining', laps: [], distance: false, gps: false },
  },
  { daysAgo: 11, time: '10:00', file: { sport: 'hiking', laps: laps(1, 8000, 7200) } },
  {
    daysAgo: 13,
    time: '07:00',
    file: { sport: 'swimming', subSport: 'lapSwimming', laps: laps(10, 100, 105), gps: false },
  },
  { daysAgo: 15, time: '18:00', file: { subSport: 'treadmill', laps: laps(5, 1000, 330), gps: false } },
  // 22:30 in New York (UTC−5), the evening before.
  { daysAgo: 18, time: '03:30', file: { laps: laps(4, 5000, 1500), localOffset: -5 * 3600 } },
  { daysAgo: 21, time: '12:00', file: { sport: 'training', subSport: 'yoga', laps: [], distance: false, gps: false } },
  { daysAgo: 24, time: '10:30', file: { sport: 'crossCountrySkiing', laps: laps(2, 6000, 1500) } },
];

/** The dev watch's model: a Forerunner 255 Music, as the real one. */
const devWatchModel = 3990;

/**
 * What the athlete rated on the watch (0–100) and Garmin's verdicts, by dev stone: most runs and
 * the ride are rated, the rest not, so stones with and without effort can both be seen (#77).
 */
const onTheWatch: Partial<Record<number, Pick<WatchFileOptions, 'rpe' | 'garminReference'>>> = {
  0: { rpe: 30, garminReference: { trainingLoad: 62.5, aerobicTrainingEffect: 2.4, anaerobicTrainingEffect: 0.3 } },
  1: { rpe: 80, garminReference: { trainingLoad: 180.25, aerobicTrainingEffect: 3.8, anaerobicTrainingEffect: 3.1 } },
  2: { rpe: 60, garminReference: { trainingLoad: 140.75, aerobicTrainingEffect: 3.4, anaerobicTrainingEffect: 0.8 } },
  3: { rpe: 50 },
  8: { rpe: 70, garminReference: { trainingLoad: 210.5, aerobicTrainingEffect: 4.1, anaerobicTrainingEffect: 1.2 } },
};

/**
 * The summary figures each dev stone's watch recorded, by its `daysAgo`, as an FR255 writes them:
 * runs have everything (cadence per leg), rides and skiing no cadence or power, the treadmill no
 * ascent, strength and yoga only heart rate and calories (yoga with temperature), the swim no
 * temperature. Stones not here recorded none.
 */
const devFigures: Partial<Record<number, WatchFileFigures>> = {
  1: run(148, 171, 42, 40, 302),
  3: { ...run(162, 186, 8, 8, 318), maxPower: 520, normalizedPower: 334 },
  5: { ...run(151, 177, 412, 405, 286), minTemperature: 9, averageTemperature: 12, maxTemperature: 14 },
  7: { averageHeartRate: 128, maxHeartRate: 154, ascent: 286, descent: 291, calories: 742 },
  9: { averageHeartRate: 104, maxHeartRate: 141, calories: 312 },
  11: {
    averageHeartRate: 118,
    maxHeartRate: 149,
    ascent: 640,
    descent: 636,
    averageCadence: 52.5,
    maxCadence: 61,
    calories: 1180,
  },
  13: { averageHeartRate: 131, maxHeartRate: 158, calories: 420 },
  15: {
    averageHeartRate: 156,
    maxHeartRate: 172,
    averageCadence: 86,
    maxCadence: 92.5,
    averagePower: 309,
    maxPower: 402,
    normalizedPower: 314,
    minTemperature: 21,
    averageTemperature: 23,
    maxTemperature: 24,
    calories: 455,
  },
  18: run(150, 175, 96, 101, 298),
  21: {
    averageHeartRate: 88,
    maxHeartRate: 112,
    minTemperature: 22,
    averageTemperature: 24,
    maxTemperature: 25,
    calories: 140,
  },
  24: { averageHeartRate: 139, maxHeartRate: 167, ascent: 198, descent: 201, calories: 905 },
};

/** A run's figures: heart rate, ascent and descent, power, and the rest an FR255 writes with them. */
function run(averageHeartRate: number, maxHeartRate: number, ascent: number, descent: number, averagePower: number) {
  return {
    averageHeartRate,
    maxHeartRate,
    ascent,
    descent,
    averageCadence: 84.5,
    maxCadence: 96,
    averagePower,
    maxPower: averagePower + 140,
    normalizedPower: averagePower + 9,
    minTemperature: 4,
    averageTemperature: 7,
    maxTemperature: 9,
    calories: Math.round(averagePower * 2.4),
  } satisfies WatchFileFigures;
}

/**
 * The dev watch every seeded file comes from. A watch file's session key is its watch and when it
 * wrote the file, so each dev stone gets a fixed time written: its key never moves with its dates.
 */
const devWatch = 1_234_567_890;
const writtenAt = (entry: number) => new Date(Date.UTC(2026, 0, 1, 0, entry));

/** `time` UTC on the day `daysAgo` days before `today`'s UTC date. */
function startOf(today: Date, daysAgo: number, time: string): Date {
  const day = new Date(today.getTime() - daysAgo * 86_400_000).toISOString().slice(0, 10);
  return new Date(`${day}T${time}:00Z`);
}

/**
 * Places the dev stones for each athlete through the API's `place` procedure, from builder files
 * (no real GPS), over the weeks before `today`. Each dev stone's session is the same whenever it
 * is seeded, so seeding again, in any week, places nothing new: each session is already placed.
 */
export async function seedStones({
  clientFor,
  athletes,
  today,
}: {
  /** The API as the athlete, signed in. */
  clientFor: (athlete: string) => ContractRouterClient<Contract>;
  athletes: string[];
  today: Date;
}): Promise<{ placed: number; alreadyPlaced: number }> {
  const result = { placed: 0, alreadyPlaced: 0 };
  for (const athlete of athletes) {
    for (const [entry, { daysAgo, time, file }] of devStones.entries()) {
      const start = startOf(today, daysAgo, time);
      const figures = devFigures[daysAgo];
      const bytes = watchFile({
        ...file,
        product: devWatchModel,
        ...onTheWatch[entry],
        start,
        serialNumber: devWatch,
        timeCreated: writtenAt(entry),
        ...(figures === undefined ? {} : { figures }),
      });
      const upload = new File([bytes as Uint8Array<ArrayBuffer>], `seed-${start.toISOString().slice(0, 10)}.fit`);
      const { error, isDefined } = await safe(clientFor(athlete).record.stones.place({ file: upload }));
      if (error === null) result.placed++;
      else if (isDefined && error.code === 'ALREADY_PLACED') result.alreadyPlaced++;
      else throw error;
    }
  }
  return result;
}
