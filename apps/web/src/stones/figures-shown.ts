import {
  type CadenceCounts,
  cadenceUnit,
  formatCadence,
  formatCalories,
  formatElevation,
  formatHeartRate,
  formatPower,
  formatTemperature,
  type UnitOption,
  units,
} from '@varda/ui/lib/format';
import type { Sport, Stone } from '../lib/stones.ts';

export type FigureKey = keyof Stone['figures'];

/** How a kind of value is shown: formatted with its unit or bare, and the unit a column's head names. */
export type ValueFormat = { format: (value: number, locale: string, options?: UnitOption) => string; unit: string };

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
const steppingSports: ReadonlySet<Sport> = new Set<Sport>([
  'road-running',
  'trail-running',
  'track-running',
  'treadmill-running',
  'walking',
  'hiking',
]);

/** What `sport`'s cadence counts. */
export const cadenceCountsOf = (sport: Sport): CadenceCounts => (steppingSports.has(sport) ? 'steps' : 'revolutions');

const heartRate: ValueFormat = { format: formatHeartRate, unit: units.heartRate };
const elevation: ValueFormat = { format: formatElevation, unit: units.elevation };
const power: ValueFormat = { format: formatPower, unit: units.power };
const temperature: ValueFormat = { format: formatTemperature, unit: units.temperature };

/** How each figure of a stone of `sport` is shown. */
export function figureFormats(sport: Sport): Record<FigureKey, ValueFormat> {
  const counts = cadenceCountsOf(sport);
  const cadence: ValueFormat = {
    format: (value, locale, options) => formatCadence(value, counts, locale, options),
    unit: cadenceUnit(counts),
  };
  return {
    averageHeartRate: heartRate,
    maxHeartRate: heartRate,
    ascent: elevation,
    descent: elevation,
    averageCadence: cadence,
    maxCadence: cadence,
    averagePower: power,
    maxPower: power,
    normalizedPower: power,
    minTemperature: temperature,
    averageTemperature: temperature,
    maxTemperature: temperature,
    calories: { format: formatCalories, unit: units.calories },
  };
}

/** The figures the watch recorded, in the order they are shown, each formatted; one it didn't record is left out. */
export function figuresShown(
  figures: Stone['figures'],
  sport: Sport,
  locale: string,
): { key: FigureKey; value: string }[] {
  const formats = figureFormats(sport);
  return order.flatMap((key) => {
    const value = figures[key];
    return value === null ? [] : [{ key, value: formats[key].format(value, locale) }];
  });
}
