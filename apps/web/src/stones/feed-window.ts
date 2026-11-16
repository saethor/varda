/** A calendar date with no zone, `YYYY-MM-DD`, as the contract speaks of local dates. */
export type LocalDate = string;

const weeksPerWindow = 4;
const day = 24 * 60 * 60 * 1000;

const shift = (date: LocalDate, days: number): LocalDate =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * day).toISOString().slice(0, 10);

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
