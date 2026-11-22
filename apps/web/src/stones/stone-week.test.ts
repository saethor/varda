import { describe, expect, it } from 'vitest';
import { heroOf, placeInWeek, weekAround } from './stone-week.ts';

const stone = (id: string, localDate: string, distance: number | null, movingTime: number, hour = 8) => ({
  id,
  localDate,
  start: new Date(`${localDate}T${String(hour).padStart(2, '0')}:00:00Z`),
  distance,
  movingTime,
});

describe('the days loaded around a stone', () => {
  it('are its Mon–Sun week and one whole week either side', () => {
    // Wednesday 11 November 2026.
    expect(weekAround('2026-11-11')).toEqual({ from: '2026-11-02', to: '2026-11-22' });
  });

  it('start from the week before even when the stone is on a Monday or a Sunday', () => {
    expect(weekAround('2026-11-09')).toEqual({ from: '2026-11-02', to: '2026-11-22' });
    expect(weekAround('2026-11-15')).toEqual({ from: '2026-11-02', to: '2026-11-22' });
  });
});

describe('a stone’s place in its week', () => {
  const lastSunday = stone('sun', '2026-11-08', 20_000, 6000);
  const mon = stone('mon', '2026-11-09', 8000, 2400);
  const tueStrength = stone('tue', '2026-11-10', null, 2700);
  const wedEarly = stone('wed-am', '2026-11-11', 10_000, 3000, 6);
  const wedLate = stone('wed-pm', '2026-11-11', 5000, 1500, 18);
  const nextMonday = stone('next', '2026-11-16', 12_000, 3600);
  const all = [nextMonday, wedLate, tueStrength, lastSunday, wedEarly, mon];

  it('counts the stones of its week up to and including it, by start', () => {
    const place = placeInWeek(wedEarly, all);
    expect(place.ordinal).toBe(3);
    expect(place.monday).toBe('2026-11-09');
  });

  it('totals distance and moving time up to and including it, every sport counting toward time', () => {
    const place = placeInWeek(wedEarly, all);
    expect(place.distance).toBe(18_000);
    expect(place.movingTime).toBe(8100);
  });

  it('orders stones on the same day by when they started', () => {
    expect(placeInWeek(wedLate, all).ordinal).toBe(4);
  });

  it('has no distance, never 0, when no stone so far has one', () => {
    const place = placeInWeek(tueStrength, [tueStrength]);
    expect(place.distance).toBeNull();
    expect(place.ordinal).toBe(1);
  });

  it('finds its neighbours across the edges of its week', () => {
    expect(placeInWeek(mon, all).previous?.id).toBe('sun');
    expect(placeInWeek(wedLate, all).next?.id).toBe('next');
    expect(placeInWeek(wedEarly, all).previous?.id).toBe('tue');
    expect(placeInWeek(wedEarly, all).next?.id).toBe('wed-pm');
  });

  it('has no neighbour where nothing was loaded', () => {
    const place = placeInWeek(mon, [mon]);
    expect(place.previous).toBeNull();
    expect(place.next).toBeNull();
  });

  it('counts itself even when the stones loaded are stale and miss it', () => {
    const place = placeInWeek(mon, [tueStrength]);
    expect(place.ordinal).toBe(1);
    expect(place.next?.id).toBe('tue');
  });
});

describe('the hero number', () => {
  it('is distance for running, time for strength', () => {
    expect(heroOf('running', 10_000)).toBe('distance');
    expect(heroOf('strength', null)).toBe('movingTime');
  });

  it('falls back to time when a stone has no distance', () => {
    expect(heroOf('running', null)).toBe('movingTime');
    expect(heroOf('cross-training', null)).toBe('movingTime');
  });

  it('is distance for cross-training that has one', () => {
    expect(heroOf('cross-training', 30_000)).toBe('distance');
  });

  it('is time for strength even with a distance', () => {
    expect(heroOf('strength', 500)).toBe('movingTime');
  });
});
