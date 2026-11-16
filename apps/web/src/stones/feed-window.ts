import { type LocalDate, shiftDate as shift } from './local-date.ts';

const weeksPerWindow = 4;

/**
 * The local dates the feed loads at a time: 4 weeks, both ends included. Window 0 ends today;
 * each "Show earlier" loads the next window back, so no day is loaded twice or skipped.
 */
export function feedWindow(today: LocalDate, window: number): { from: LocalDate; to: LocalDate } {
  const days = weeksPerWindow * 7;
  const to = shift(today, -window * days);
  return { from: shift(to, -(days - 1)), to };
}

/** Today's date where the person is. */
export function todayHere(now: Date): LocalDate {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
