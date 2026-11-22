import { type LocalDate, shiftDate as shift } from './local-date.ts';
import { mondayOf } from './stone-week.ts';

const weeksPerWindow = 4;

/**
 * The local dates the list loads at a time, both ends included: whole Mon–Sun weeks, so no week is
 * cut in two and its totals are whole. Window 0 is this week so far and the 3 weeks before it; each
 * "Show earlier" loads the 4 weeks before that, so no day is loaded twice or skipped.
 */
export function feedWindow(today: LocalDate, window: number): { from: LocalDate; to: LocalDate } {
  const days = weeksPerWindow * 7;
  const nextMonday = shift(mondayOf(today), 7 - window * days);
  return { from: shift(nextMonday, -days), to: window === 0 ? today : shift(nextMonday, -1) };
}

/** Today's date where the person is. */
export function todayHere(now: Date): LocalDate {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
