import { describe, expect, it } from 'vitest';
import {
  formatCadence,
  formatCalories,
  formatDistance,
  formatDuration,
  formatElevation,
  formatHeartRate,
  formatHeight,
  formatPace,
  formatPower,
  formatSpeed,
  formatTemperature,
  formatWeight,
} from './format.ts';

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

describe("formatting a stone's figures", () => {
  it('shows each as a whole number with its unit, the way the language shown writes numbers', () => {
    expect(formatHeartRate(152.4, 'en')).toBe('152 bpm');
    expect(formatElevation(1284.6, 'en')).toBe('1,285 m');
    expect(formatElevation(1284.6, 'is')).toBe('1.285 m');
    expect(formatPower(301, 'en')).toBe('301 W');
    expect(formatTemperature(-4, 'en')).toBe('-4 °C');
    expect(formatCalories(1712, 'en')).toBe('1,712 kcal');
  });

  it('shows cadence in steps a minute for a stepping sport and in revolutions otherwise', () => {
    expect(formatCadence(169.58, 'steps', 'en')).toBe('170 spm');
    expect(formatCadence(82, 'revolutions', 'en')).toBe('82 rpm');
  });

  it('leaves the unit out when asked', () => {
    expect(formatHeartRate(152, 'en', { unit: false })).toBe('152');
  });
});

describe("formatting the athlete's measurements", () => {
  it('shows weight in kilograms to one decimal, in the language shown', () => {
    expect(formatWeight(71.3, 'en')).toBe('71.3 kg');
    expect(formatWeight(68, 'is')).toBe('68,0 kg');
  });

  it('shows height in centimetres', () => {
    expect(formatHeight(1.83)).toBe('183 cm');
  });
});
