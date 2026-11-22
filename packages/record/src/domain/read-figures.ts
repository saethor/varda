// The watch's own figures for a session or a lap, read from the FIT message that holds them.
// Session and lap messages name these fields alike, so laps read theirs the same way.
import type { LapMesg, SessionMesg } from '@garmin/fitsdk';
import type { Sport } from '@varda/shared';
import { cadenceOf } from './sports.ts';
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
  return {
    averageHeartRate: mesg.avgHeartRate ?? null,
    maxHeartRate: mesg.maxHeartRate ?? null,
    ascent: mesg.totalAscent ?? null,
    descent: mesg.totalDescent ?? null,
    averageCadence: cadenceOf(sport, mesg.avgCadence, mesg.avgFractionalCadence),
    maxCadence: cadenceOf(sport, mesg.maxCadence, mesg.maxFractionalCadence),
    averagePower: mesg.avgPower ?? null,
    maxPower: mesg.maxPower ?? null,
    normalizedPower: mesg.normalizedPower ?? null,
    minTemperature: mesg.minTemperature ?? null,
    averageTemperature: mesg.avgTemperature ?? null,
    maxTemperature: mesg.maxTemperature ?? null,
    calories: mesg.totalCalories ?? null,
  };
}
