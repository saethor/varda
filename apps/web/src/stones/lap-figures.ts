import {
  formatCadence,
  formatCalories,
  formatElevation,
  formatHeartRate,
  formatPower,
  formatTemperature,
} from '@varda/ui/lib/format';
import type { Sport, Stone } from '../lib/stones.ts';
import { type FigureKey, steppingSports } from './figures-shown.ts';

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
  const counts = steppingSports.includes(sport) ? 'steps' : 'revolutions';
  const bare = { unit: false };
  const column = (key: LapFigureKey): Pick<LapFigureColumn, 'unit'> & { format: (value: number) => string } => {
    switch (key) {
      case 'averageHeartRate':
      case 'maxHeartRate':
        return { unit: 'bpm', format: (value) => formatHeartRate(value, locale, bare) };
      case 'ascent':
      case 'descent':
        return { unit: 'm', format: (value) => formatElevation(value, locale, bare) };
      case 'averageCadence':
        return {
          unit: counts === 'steps' ? 'spm' : 'rpm',
          format: (value) => formatCadence(value, counts, locale, bare),
        };
      case 'averagePower':
      case 'maxPower':
      case 'normalizedPower':
        return { unit: 'W', format: (value) => formatPower(value, locale, bare) };
      case 'averageTemperature':
        return { unit: '°C', format: (value) => formatTemperature(value, locale, bare) };
      case 'calories':
        return { unit: 'kcal', format: (value) => formatCalories(value, locale, bare) };
    }
  };
  return order.flatMap((key) => {
    if (laps.every((lap) => lap.figures[key] === null)) return [];
    const { unit, format } = column(key);
    return [{ key, unit, values: laps.map((lap) => (lap.figures[key] === null ? null : format(lap.figures[key]))) }];
  });
}

/**
 * Whether the lap table shows each lap's intensity: only when the watch marked some lap as other
 * than the work, since a column of laps that are all the work (as on a ride) tells nothing apart.
 */
export function showsIntensity(laps: Lap[]): boolean {
  return laps.some((lap) => lap.intensity !== null && lap.intensity !== 'active');
}
