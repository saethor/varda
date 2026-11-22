import {
  formatCadence,
  formatCalories,
  formatElevation,
  formatHeartRate,
  formatPower,
  formatTemperature,
} from '@varda/ui/lib/format';
import type { Sport, Stone } from '../lib/stones.ts';

export type FigureKey = keyof Stone['figures'];

// The order the figures are shown in: heart rate, the ground, cadence, power, temperature, energy.
const order: FigureKey[] = [
  'averageHeartRate',
  'maxHeartRate',
  'ascent',
  'descent',
  'averageCadence',
  'maxCadence',
  'averagePower',
  'maxPower',
  'normalizedPower',
  'minTemperature',
  'averageTemperature',
  'maxTemperature',
  'calories',
];

// Sports whose cadence counts steps (the contract gives them in steps a minute); the rest count revolutions.
const steppingSports: Sport[] = [
  'road-running',
  'trail-running',
  'track-running',
  'treadmill-running',
  'walking',
  'hiking',
];

/** The figures the watch recorded, in the order they are shown, each formatted; one it didn't record is left out. */
export function figuresShown(
  figures: Stone['figures'],
  sport: Sport,
  locale: string,
): { key: FigureKey; value: string }[] {
  const counts = steppingSports.includes(sport) ? 'steps' : 'revolutions';
  const format = (key: FigureKey, value: number): string => {
    switch (key) {
      case 'averageHeartRate':
      case 'maxHeartRate':
        return formatHeartRate(value, locale);
      case 'ascent':
      case 'descent':
        return formatElevation(value, locale);
      case 'averageCadence':
      case 'maxCadence':
        return formatCadence(value, counts, locale);
      case 'averagePower':
      case 'maxPower':
      case 'normalizedPower':
        return formatPower(value, locale);
      case 'minTemperature':
      case 'averageTemperature':
      case 'maxTemperature':
        return formatTemperature(value, locale);
      case 'calories':
        return formatCalories(value, locale);
    }
  };
  return order.flatMap((key) => {
    const value = figures[key];
    return value === null ? [] : [{ key, value: format(key, value) }];
  });
}
