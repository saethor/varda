// The watch's own figures for a session or a lap, read from the FIT message that holds them.
// Session and lap messages name these fields alike, so laps read theirs the same way.
import type { LapMesg, SessionMesg } from '@garmin/fitsdk';
import type { Sport } from '@varda/shared';
import type { Figures } from './stone.ts';

type FiguresMesg = Pick<
  SessionMesg & LapMesg,
  | 'avgHeartRate'
  | 'maxHeartRate'
  | 'totalAscent'
  | 'totalDescent'
  | 'avgCadence'
  | 'avgFractionalCadence'
  | 'maxCadence'
  | 'maxFractionalCadence'
  | 'avgPower'
  | 'maxPower'
  | 'normalizedPower'
  | 'minTemperature'
  | 'avgTemperature'
  | 'maxTemperature'
  | 'totalCalories'
>;

/** The figures a session or lap message recorded for `sport`, each null when it recorded none. */
export function readFigures(mesg: FiguresMesg, sport: Sport): Figures {
  const cadence = cadenceOf(sport);
  return {
    averageHeartRate: mesg.avgHeartRate ?? null,
    maxHeartRate: mesg.maxHeartRate ?? null,
    ascent: mesg.totalAscent ?? null,
    descent: mesg.totalDescent ?? null,
    averageCadence: cadence(mesg.avgCadence, mesg.avgFractionalCadence),
    maxCadence: cadence(mesg.maxCadence, mesg.maxFractionalCadence),
    averagePower: mesg.avgPower ?? null,
    maxPower: mesg.maxPower ?? null,
    normalizedPower: mesg.normalizedPower ?? null,
    minTemperature: mesg.minTemperature ?? null,
    averageTemperature: mesg.avgTemperature ?? null,
    maxTemperature: mesg.maxTemperature ?? null,
    calories: mesg.totalCalories ?? null,
  };
}

// Sports whose cadence counts steps. FIT records them per leg (strides a minute); the watch shows
// both legs, so Varða doubles them to agree with it. Every other sport's cadence is rpm as recorded.
const steppingSports: readonly Sport[] = [
  'road-running',
  'trail-running',
  'track-running',
  'treadmill-running',
  'walking',
  'hiking',
];

function cadenceOf(sport: Sport) {
  const legs = steppingSports.includes(sport) ? 2 : 1;
  return (whole: number | undefined, fraction: number | undefined): number | null =>
    whole === undefined ? null : (whole + (fraction ?? 0)) * legs;
}
