// A run's running form, read from the session or lap message that holds its averages. FIT words
// (stance time) stay in this file.
import type { LapMesg, SessionMesg } from '@garmin/fitsdk';
import { type Sport, sportGroupOf } from '@varda/shared';
import type { Form } from './stone.ts';

type FormMesg = Pick<
  SessionMesg & LapMesg,
  'avgStepLength' | 'avgVerticalOscillation' | 'avgVerticalRatio' | 'avgStanceTime'
>;

/**
 * The form averages a session or lap message recorded, in SI units (the watch writes mm and ms), or
 * none for a sport other than running, or when the watch recorded none of them. Each is none (never
 * 0) when the watch didn't record it.
 */
export function readForm(mesg: FormMesg, sport: Sport): Form | null {
  if (!isRunning(sport)) return null;
  const form = {
    stepLength: thousandths(mesg.avgStepLength),
    verticalOscillation: thousandths(mesg.avgVerticalOscillation),
    verticalRatio: positiveOrNull(mesg.avgVerticalRatio),
    groundContactTime: thousandths(mesg.avgStanceTime),
  };
  return Object.values(form).some((value) => value !== null) ? form : null;
}

/** Only running has running form; other sports' files may hold form fields, which are never read. */
export const isRunning = (sport: Sport) => sportGroupOf(sport) === 'running';

const positiveOrNull = (value: unknown) => (typeof value === 'number' && value > 0 ? value : null);
const thousandths = (value: unknown) => {
  const positive = positiveOrNull(value);
  return positive === null ? null : positive / 1000;
};
