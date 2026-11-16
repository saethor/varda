import { placeStone, type RecordAdapters } from '@varda/record';
import { type WatchFileLap, type WatchFileOptions, watchFile } from '@varda/record/watch-files';

/** `count` laps of `distance` metres in `timerTime` seconds, each with 10 s stopped. */
const laps = (count: number, distance: number, timerTime: number): WatchFileLap[] =>
  Array.from({ length: count }, () => ({ distance, timerTime, elapsedTime: timerTime + 10 }));

/** Track intervals: fast 400s with slow 200s between them. */
const intervals = Array.from({ length: 5 }, () => [...laps(1, 400, 80), ...laps(1, 200, 75)]).flat();

/**
 * The stones every dev person gets: days from the Monday of the current week, a UTC start time,
 * and the watch file. A few sports, with and without laps.
 */
const devStones: { day: number; time: string; file: WatchFileOptions }[] = [
  { day: 3, time: '06:40', file: {} },
  { day: 1, time: '17:15', file: { subSport: 'track', laps: intervals } },
  { day: -2, time: '09:00', file: { subSport: 'trail', laps: laps(2, 5000, 1800) } },
  { day: -4, time: '17:30', file: { sport: 'cycling', subSport: 'road', laps: laps(2, 15_000, 1800) } },
  { day: -6, time: '12:10', file: { sport: 'training', subSport: 'strengthTraining', laps: [], distance: false } },
  { day: -8, time: '10:00', file: { sport: 'hiking', laps: laps(1, 8000, 7200) } },
  { day: -10, time: '07:00', file: { sport: 'swimming', subSport: 'lapSwimming', laps: laps(10, 100, 105) } },
  { day: -13, time: '18:00', file: { subSport: 'treadmill', laps: laps(5, 1000, 330) } },
  { day: -16, time: '08:30', file: { laps: laps(4, 5000, 1500) } },
  { day: -19, time: '12:00', file: { sport: 'training', subSport: 'yoga', laps: [], distance: false } },
  { day: -22, time: '10:30', file: { sport: 'crossCountrySkiing', laps: laps(2, 6000, 1500) } },
];

/** Midnight UTC on the Monday of the week `today` falls in. */
function mondayOf(today: Date): Date {
  const monday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday;
}

/**
 * Places the dev stones for each athlete through Record's placing use case, from builder files
 * (no real GPS). The days hang off the current week's Monday, so seeding again in the same week
 * places nothing new: each session is already placed. Stones later than `today` wait for a later run.
 */
export async function seedStones({
  record,
  athletes,
  today,
}: {
  record: RecordAdapters;
  athletes: string[];
  today: Date;
}): Promise<{ placed: number; alreadyPlaced: number }> {
  const result = { placed: 0, alreadyPlaced: 0 };
  const monday = mondayOf(today);
  for (const athlete of athletes) {
    for (const { day, time, file } of devStones) {
      const start = new Date(`${new Date(monday.getTime() + day * 86_400_000).toISOString().slice(0, 10)}T${time}:00Z`);
      if (start > today) continue;
      const bytes = watchFile({ ...file, start });
      const placing = await placeStone(record, athlete, {
        name: `seed-${start.toISOString().slice(0, 10)}.fit`,
        bytes,
      });
      if ('placed' in placing) result.placed++;
      else result.alreadyPlaced++;
    }
  }
  return result;
}
