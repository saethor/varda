import type { Sport, Stone } from '../lib/stones.ts';
import { type FigureKey, figureFormats } from './figures-shown.ts';

type Lap = Stone['laps'][number];

/** A figure column of the lap table: its unit for the column head, and each lap's bare value, or none. */
export type LapFigureColumn = { key: LapFigureKey; unit: string; values: (string | null)[] };

/** The figures the lap table shows, in the summary's order: heart rate, the ground, cadence, power, temperature, energy. */
export type LapFigureKey = Extract<
  FigureKey,
  | 'averageHeartRate'
  | 'maxHeartRate'
  | 'ascent'
  | 'descent'
  | 'averageCadence'
  | 'averagePower'
  | 'maxPower'
  | 'normalizedPower'
  | 'averageTemperature'
  | 'calories'
>;

const order: LapFigureKey[] = [
  'averageHeartRate',
  'maxHeartRate',
  'ascent',
  'descent',
  'averageCadence',
  'averagePower',
  'maxPower',
  'normalizedPower',
  'averageTemperature',
  'calories',
];

/** A column for each figure some lap recorded, in order; one no lap recorded is left out. */
export function lapFigures(laps: Lap[], sport: Sport, locale: string): LapFigureColumn[] {
  const formats = figureFormats(sport);
  return order.flatMap((key) => {
    if (laps.every((lap) => lap.figures[key] === null)) return [];
    const { unit, format } = formats[key];
    const values = laps.map((lap) => {
      const value = lap.figures[key];
      return value === null ? null : format(value, locale, { unit: false });
    });
    return [{ key, unit, values }];
  });
}

/**
 * Whether the lap table shows each lap's intensity: only when the watch marked some lap as other
 * than the work, since a column of laps that are all the work (as on a ride) tells nothing apart.
 */
export function showsIntensity(laps: Lap[]): boolean {
  return laps.some((lap) => lap.intensity !== null && lap.intensity !== 'active');
}
