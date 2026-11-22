import type { ContractRouterClient } from '@orpc/contract';
import { safe } from '@orpc/server';
import type { Contract } from '@varda/contract';
import { type WatchFileChannel, type WatchFileLap, type WatchFileOptions, watchFile } from '@varda/record/watch-files';

/** `count` laps of `distance` metres in `timerTime` seconds, each with 10 s stopped. */
const laps = (count: number, distance: number, timerTime: number): WatchFileLap[] =>
  Array.from({ length: count }, () => ({ distance, timerTime, elapsedTime: timerTime + 10 }));

/** Track intervals: fast 400s with slow 200s between them. */
const intervals = Array.from({ length: 5 }, () => [...laps(1, 400, 80), ...laps(1, 200, 75)]).flat();

/** What a watch without a power meter or running pod records on a bike or skis. */
const onABike: WatchFileChannel[] = ['power', 'cadence', 'form'];
/** What a watch records in the gym: heart rate, nothing else. */
const heartRateOnly: WatchFileChannel[] = ['altitude', 'power', 'cadence', 'temperature', 'form'];

/**
 * The stones every dev person gets: how many days before today, a UTC start time, and the watch
 * file. A few sports, with and without laps; those indoors or in a pool have no GPS, so no trace.
 * One was run abroad, late in the evening there, past midnight in UTC. All but the swim record a
 * point every second, pausing in each lap, with the channels a watch records in that sport.
 */
const devStones: { daysAgo: number; time: string; file: WatchFileOptions }[] = [
  { daysAgo: 1, time: '06:40', file: { perSecond: true } },
  { daysAgo: 3, time: '17:15', file: { subSport: 'track', laps: intervals, perSecond: true } },
  { daysAgo: 5, time: '09:00', file: { subSport: 'trail', laps: laps(2, 5000, 1800), perSecond: true } },
  {
    daysAgo: 7,
    time: '17:30',
    file: { sport: 'cycling', subSport: 'road', laps: laps(2, 15_000, 1800), perSecond: true, without: onABike },
  },
  {
    daysAgo: 9,
    time: '12:10',
    file: {
      sport: 'training',
      subSport: 'strengthTraining',
      laps: [],
      distance: false,
      gps: false,
      perSecond: true,
      without: heartRateOnly,
    },
  },
  {
    daysAgo: 11,
    time: '10:00',
    file: { sport: 'hiking', laps: laps(1, 8000, 7200), perSecond: true, without: ['power', 'form'] },
  },
  {
    daysAgo: 13,
    time: '07:00',
    file: { sport: 'swimming', subSport: 'lapSwimming', laps: laps(10, 100, 105), gps: false },
  },
  {
    daysAgo: 15,
    time: '18:00',
    file: { subSport: 'treadmill', laps: laps(5, 1000, 330), gps: false, perSecond: true, without: ['altitude'] },
  },
  // 22:30 in New York (UTC−5), the evening before.
  { daysAgo: 18, time: '03:30', file: { laps: laps(4, 5000, 1500), localOffset: -5 * 3600, perSecond: true } },
  {
    daysAgo: 21,
    time: '12:00',
    file: {
      sport: 'training',
      subSport: 'yoga',
      laps: [],
      distance: false,
      gps: false,
      perSecond: true,
      without: heartRateOnly,
    },
  },
  {
    daysAgo: 24,
    time: '10:30',
    file: { sport: 'crossCountrySkiing', laps: laps(2, 6000, 1500), perSecond: true, without: onABike },
  },
];

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
      const bytes = watchFile({ ...file, start, serialNumber: devWatch, timeCreated: writtenAt(entry) });
      const upload = new File([bytes as Uint8Array<ArrayBuffer>], `seed-${start.toISOString().slice(0, 10)}.fit`);
      const { error, isDefined } = await safe(clientFor(athlete).record.stones.place({ file: upload }));
      if (error === null) result.placed++;
      else if (isDefined && error.code === 'ALREADY_PLACED') result.alreadyPlaced++;
      else throw error;
    }
  }
  return result;
}
