import { formatPace, formatSpeed, type PaceDistance, paceHeadUnit, type UnitOption, units } from '@varda/ui/lib/format';
import type { Sport } from '../lib/stones.ts';

/** `unit` is what a column header shows above bare values: `min/km`, `min/100 m` or `km/h`. */
export type PaceOrSpeed = { measure: 'pace' | 'speed'; value: string; unit: string };

/** How a sport talks about how fast it went: its pace over a kilometre or 100 metres, or its speed. */
export type HowFast = { measure: 'pace'; per: PaceDistance } | { measure: 'speed' };

const perKilometre: HowFast = { measure: 'pace', per: 'kilometre' };

// Strength and other sessions get neither: their distance, when the watch records one at all, says
// little about the effort.
const howFastBySport: Record<Sport, HowFast | null> = {
  'road-running': perKilometre,
  'trail-running': perKilometre,
  'track-running': perKilometre,
  'treadmill-running': perKilometre,
  walking: perKilometre,
  hiking: perKilometre,
  swimming: { measure: 'pace', per: '100 metres' },
  cycling: { measure: 'speed' },
  skiing: { measure: 'speed' },
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
  const howFast = howFastBySport[sport];
  if (howFast === null || metres === null || metres <= 0 || seconds <= 0) return null;
  return howFast.measure === 'speed'
    ? { measure: 'speed', value: formatSpeed(metres, seconds, locale, options), unit: units.speed }
    : {
        measure: 'pace',
        value: formatPace(metres, seconds, howFast.per, options),
        unit: paceHeadUnit(howFast.per),
      };
}

/** How `sport` talks about how fast it went, or neither. */
export function howFastOf(sport: Sport): HowFast | null {
  return howFastBySport[sport];
}
