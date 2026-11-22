import { formatPace, formatSpeed, type UnitOption } from '@varda/ui/lib/format';
import type { Sport } from '../lib/stones.ts';

/** `unit` is what a column header shows above bare values: `min/km`, `min/100 m` or `km/h`. */
export type PaceOrSpeed = { measure: 'pace' | 'speed'; value: string; unit: string };

// How each sport talks about how fast it went. Strength and other sessions get neither: their
// distance, when the watch records one at all, says little about the effort.
const measureOf: Record<Sport, { pace: 1000 | 100 } | 'speed' | null> = {
  'road-running': { pace: 1000 },
  'trail-running': { pace: 1000 },
  'track-running': { pace: 1000 },
  'treadmill-running': { pace: 1000 },
  walking: { pace: 1000 },
  hiking: { pace: 1000 },
  swimming: { pace: 100 },
  cycling: 'speed',
  skiing: 'speed',
  strength: null,
  other: null,
};

/** The pace or speed of `metres` in `seconds` of moving time, as `sport` talks about it, or none. */
export function paceOrSpeed(
  sport: Sport,
  metres: number | null,
  seconds: number,
  locale: string,
  options: UnitOption = {},
): PaceOrSpeed | null {
  const measure = measureOf[sport];
  if (measure === null || metres === null || metres <= 0 || seconds <= 0) return null;
  return measure === 'speed'
    ? { measure: 'speed', value: formatSpeed(metres, seconds, locale, options), unit: 'km/h' }
    : {
        measure: 'pace',
        value: formatPace(metres, seconds, measure.pace, options),
        unit: measure.pace === 1000 ? 'min/km' : 'min/100 m',
      };
}

/** How `sport` talks about how fast it went: pace per 1000 or 100 metres, speed, or neither. */
export function measureOfSport(sport: Sport): { pace: 1000 | 100 } | 'speed' | null {
  return measureOf[sport];
}
