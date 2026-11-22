// A run's running form, read from the session or lap message that holds its averages. FIT words
// (stance time) stay in this file.
import type { LapMesg, SessionMesg } from '@garmin/fitsdk';
import type { Sport } from '@varda/shared';
import { isRunning } from './sports.ts';
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
    stepLength: fromThousandths(positiveOrNull(mesg.avgStepLength)),
    verticalOscillation: fromThousandths(positiveOrNull(mesg.avgVerticalOscillation)),
    verticalRatio: positiveOrNull(mesg.avgVerticalRatio),
    groundContactTime: fromThousandths(positiveOrNull(mesg.avgStanceTime)),
  };
  return Object.values(form).some((value) => value !== null) ? form : null;
}

const positiveOrNull = (value: unknown) => (typeof value === 'number' && value > 0 ? value : null);

/** A value the watch writes in thousandths (mm, ms) in SI units (m, s), or none when it wrote none. */
export const fromThousandths = (value: unknown): number | null => (typeof value === 'number' ? value / 1000 : null);
