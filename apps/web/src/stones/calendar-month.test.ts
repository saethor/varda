import { describe, expect, it } from 'vitest';
import { calendarWeeks, monthOnScreen, otherMonth } from './calendar-month.ts';

describe('the month on screen', () => {
  it('runs from the Monday of its first week to the Sunday of its last', () => {
    expect(monthOnScreen('2026-11')).toEqual({ from: '2026-10-26', to: '2026-12-06' });
  });

  it('shows no day of the months around it when the month is whole weeks', () => {
    expect(monthOnScreen('2027-02')).toEqual({ from: '2027-02-01', to: '2027-02-28' });
  });
});

const stone = (
  id: string,
  localDate: string,
  distance: number | null,
  movingTime: number,
  start = `${localDate}T08:00:00Z`,
) => ({
  id,
  localDate,
  start: new Date(start),
  distance,
  movingTime,
});

describe('the weeks of a month', () => {
  it('lays the month out in Mon–Sun weeks, marking the days of the months around it', () => {
    const weeks = calendarWeeks('2026-11', []);

    expect(weeks).toHaveLength(6);
    expect(weeks[0]?.days.map((d) => d.date)).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
    expect(weeks[0]?.days.map((d) => d.inMonth)).toEqual([false, false, false, false, false, false, true]);
    expect(weeks[5]?.days[0]).toMatchObject({ date: '2026-11-30', inMonth: true });
    expect(weeks[5]?.days[6]).toMatchObject({ date: '2026-12-06', inMonth: false });
  });

  it('puts each stone on its local date, earliest start first', () => {
    const evening = stone('evening', '2026-11-03', 5000, 1500, '2026-11-03T18:00:00Z');
    const morning = stone('morning', '2026-11-03', 8000, 2400, '2026-11-03T06:00:00Z');
    const sunday = stone('sunday', '2026-11-08', 20000, 6000);

    const weeks = calendarWeeks('2026-11', [sunday, evening, morning]);

    expect(weeks[1]?.days[1]?.stones.map((s) => s.id)).toEqual(['morning', 'evening']);
    expect(weeks[1]?.days[6]?.stones.map((s) => s.id)).toEqual(['sunday']);
    expect(weeks[2]?.days.flatMap((d) => d.stones)).toEqual([]);
  });

  it('totals each week: stones, distance and moving time, counting stones with no distance', () => {
    const weeks = calendarWeeks('2026-11', [
      stone('run', '2026-11-02', 10000, 3000),
      stone('strength', '2026-11-04', null, 2700),
      stone('ride', '2026-11-08', 40000, 5400),
    ]);

    expect(weeks[1]?.totals).toEqual({ stones: 3, distance: 50000, movingTime: 11100 });
  });

  it('gives a week with no distance none, rather than 0', () => {
    const weeks = calendarWeeks('2026-11', [stone('strength', '2026-11-04', null, 2700)]);

    expect(weeks[1]?.totals).toEqual({ stones: 1, distance: null, movingTime: 2700 });
    expect(weeks[2]?.totals).toEqual({ stones: 0, distance: null, movingTime: 0 });
  });
});

describe('moving between months', () => {
  it('goes to the month before and after, across a year change', () => {
    expect(otherMonth('2027-01', -1)).toBe('2026-12');
    expect(otherMonth('2026-12', 1)).toBe('2027-01');
  });
});
