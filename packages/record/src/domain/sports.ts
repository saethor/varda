import { type Sport, sportGroupOf } from '@varda/shared';

/**
 * Only running has running form and stretches; other sports' files may hold form fields or run/walk
 * splits, which are never read.
 */
export const isRunning = (sport: Sport) => sportGroupOf(sport) === 'running';

/**
 * Sports whose cadence counts steps (Record glossary: Cadence). FIT records them per leg (strides a
 * minute); the watch shows both legs, so Varða doubles them to agree with it. Every other sport's
 * cadence is revolutions a minute, as recorded.
 */
const steppingSports: ReadonlySet<Sport> = new Set<Sport>([
  'road-running',
  'trail-running',
  'track-running',
  'treadmill-running',
  'walking',
  'hiking',
]);

/** A cadence as the watch shows it: steps a minute on foot (strides per leg, doubled), revolutions otherwise. */
export function cadenceOf(sport: Sport, whole: number | undefined, fraction: number | undefined): number | null {
  if (typeof whole !== 'number') return null;
  return steppingSports.has(sport) ? (whole + (fraction ?? 0)) * 2 : whole + (fraction ?? 0);
}
