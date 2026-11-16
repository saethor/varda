import { formatPace, formatSpeed } from '@varda/ui/lib/format';
import type { Sport } from '../lib/stones.ts';

export type PaceOrSpeed = { measure: 'pace' | 'speed'; value: string };

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
export function paceOrSpeed(sport: Sport, metres: number | null, seconds: number, locale: string): PaceOrSpeed | null {
  const measure = measureOf[sport];
  if (measure === null || metres === null || metres <= 0 || seconds <= 0) return null;
  return measure === 'speed'
    ? { measure: 'speed', value: formatSpeed(metres, seconds, locale) }
    : { measure: 'pace', value: formatPace(metres, seconds, measure.pace) };
}
