import { type LocalDate, midnightOf, shiftDate as shift } from './local-date.ts';

/** A calendar month with no zone, `YYYY-MM`. */
export type Month = string;

/** What the calendar needs of a stone. Times in seconds, distance in metres or none. */
interface CalendarStone {
  localDate: LocalDate;
  start: Date;
  distance: number | null;
  movingTime: number;
}

export interface CalendarDay<S> {
  date: LocalDate;
  /** False for the days of the months before and after that fill out the first and last week. */
  inMonth: boolean;
  /** Earliest start first. */
  stones: S[];
}

export interface CalendarWeek<S> {
  /** Monday to Sunday. */
  days: CalendarDay<S>[];
  /** Distance is none when no stone in the week has one, never 0. */
  totals: { stones: number; distance: number | null; movingTime: number };
}

/** Monday is 0, Sunday 6. */
const weekday = (date: LocalDate) => (midnightOf(date).getUTCDay() + 6) % 7;
const yearAndNumber = (month: Month) => month.split('-').map(Number) as [number, number];

/** The month a local date falls in. */
export const monthOf = (date: LocalDate): Month => date.slice(0, 7);

/** The month `by` months before (negative) or after `month`. */
export function otherMonth(month: Month, by: number): Month {
  const [year, number] = yearAndNumber(month);
  return new Date(Date.UTC(year, number - 1 + by, 1)).toISOString().slice(0, 7);
}

/**
 * The local dates the calendar shows for a month, both ends included: whole Mon–Sun weeks, so the
 * first and last week carry days of the months around it. This is the range the calendar loads.
 */
export function monthOnScreen(month: Month): { from: LocalDate; to: LocalDate } {
  const [year, number] = yearAndNumber(month);
  const first = `${month}-01`;
  const last = new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10);
  return { from: shift(first, -weekday(first)), to: shift(last, 6 - weekday(last)) };
}

/**
 * The month on screen as Mon–Sun weeks, each stone on the day of its local date, with each week's
 * totals. The first and last week are whole, so the days they carry of the months around this one
 * show their stones, and count in their week's totals; stones outside those weeks are left out.
 */
export function calendarWeeks<S extends CalendarStone>(month: Month, stones: readonly S[]): CalendarWeek<S>[] {
  const { from, to } = monthOnScreen(month);
  const byStart = [...stones].sort((a, b) => a.start.getTime() - b.start.getTime());
  const weeks: CalendarWeek<S>[] = [];

  for (let monday = from; monday <= to; monday = shift(monday, 7)) {
    const days = Array.from({ length: 7 }, (_, i): CalendarDay<S> => {
      const date = shift(monday, i);
      return { date, inMonth: monthOf(date) === month, stones: byStart.filter((s) => s.localDate === date) };
    });
    const inWeek = days.flatMap((d) => d.stones);
    const distances = inWeek.flatMap((s) => (s.distance === null ? [] : [s.distance]));
    weeks.push({
      days,
      totals: {
        stones: inWeek.length,
        distance: distances.length === 0 ? null : distances.reduce((sum, d) => sum + d, 0),
        movingTime: inWeek.reduce((sum, s) => sum + s.movingTime, 0),
      },
    });
  }
  return weeks;
}
