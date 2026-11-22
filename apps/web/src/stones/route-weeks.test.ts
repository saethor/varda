import { describe, expect, it } from 'vitest';
import { routeWeeks, stitchRange, stitchRows } from './route-weeks.ts';

const stone = (id: string, localDate: string, distance: number | null, movingTime: number) => ({
  id,
  localDate,
  start: new Date(`${localDate}T07:00:00Z`),
  distance,
  movingTime,
});

describe('the route weeks', () => {
  const stones = [
    stone('a', '2026-11-09', 30_000, 3600),
    stone('b', '2026-11-15', 3000, 900),
    stone('c', '2026-11-07', null, 900),
  ];

  it('runs from the newest week to the oldest, each with its stones newest first', () => {
    const weeks = routeWeeks(stones, '2026-10-26', '2026-11-18');
    expect(weeks.map((w) => w.monday)).toEqual(['2026-11-16', '2026-11-09', '2026-11-02', '2026-10-26']);
    expect(weeks[1]?.stones.map((s) => s.id)).toEqual(['b', 'a']);
  });

  it('keeps a week with no stones, totalling nothing', () => {
    const [thisWeek] = routeWeeks(stones, '2026-10-26', '2026-11-18');
    expect(thisWeek?.totals).toEqual({ stones: 0, distance: null, movingTime: 0 });
  });

  it('adds up a week, every sport counting for time, with no distance when none has one', () => {
    const weeks = routeWeeks(stones, '2026-10-26', '2026-11-18');
    expect(weeks[1]?.totals).toEqual({ stones: 2, distance: 33_000, movingTime: 4500 });
    expect(weeks[2]?.totals).toEqual({ stones: 1, distance: null, movingTime: 900 });
  });
});

describe('the stitch rows', () => {
  it('loads whole weeks back from the one today falls in', () => {
    expect(stitchRange('2026-11-18', 12)).toEqual({ from: '2026-08-31', to: '2026-11-18' });
  });

  it('gives each week its seven days, newest week first, with the days after today ahead', () => {
    const rows = stitchRows([stone('b', '2026-11-15', 3000, 900)], '2026-11-18', 2);
    expect(rows.map((r) => r.monday)).toEqual(['2026-11-16', '2026-11-09']);
    expect(rows[0]?.days.map((d) => d.ahead)).toEqual([false, false, false, true, true, true, true]);
    expect(rows[1]?.days[6]?.stones.map((s) => s.id)).toEqual(['b']);
    expect(rows[1]?.stones).toBe(1);
  });
});
