import { describe, expect, it } from 'vitest';
import { formatDistance, formatDuration, formatPace, formatSpeed } from './format.ts';

describe('formatting a duration', () => {
  it('shows minutes and seconds under an hour', () => {
    expect(formatDuration(930)).toBe('15:30');
    expect(formatDuration(65)).toBe('1:05');
  });

  it('shows hours from an hour on', () => {
    expect(formatDuration(3_725)).toBe('1:02:05');
  });

  it('rounds to the nearest second', () => {
    expect(formatDuration(59.6)).toBe('1:00');
  });
});

describe('formatting a distance', () => {
  it('shows kilometres to two decimals, in the language shown', () => {
    expect(formatDistance(10_234.5, 'en')).toBe('10.23 km');
    expect(formatDistance(3000, 'is')).toBe('3,00 km');
  });
});

describe('formatting a pace', () => {
  it('shows the time per kilometre', () => {
    // 3 km in 15 minutes.
    expect(formatPace(3000, 900, 1000)).toBe('5:00 /km');
  });

  it('shows the time per 100 metres', () => {
    // 1500 m in 26:15.
    expect(formatPace(1500, 1575, 100)).toBe('1:45 /100 m');
  });
});

describe('formatting a speed', () => {
  it('shows kilometres per hour to one decimal, in the language shown', () => {
    // 42 km in 1:40:00.
    expect(formatSpeed(42_000, 6000, 'en')).toBe('25.2 km/h');
    expect(formatSpeed(42_000, 6000, 'is')).toBe('25,2 km/h');
  });
});

describe('leaving the unit out, for a column whose header names it', () => {
  it('shows the bare distance, pace and speed', () => {
    expect(formatDistance(1234, 'is', { unit: false })).toBe('1,23');
    expect(formatPace(1000, 300, 1000, { unit: false })).toBe('5:00');
    expect(formatSpeed(10_000, 3600, 'en', { unit: false })).toBe('10.0');
  });
});
