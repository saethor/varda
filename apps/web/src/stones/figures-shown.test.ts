import { describe, expect, it } from 'vitest';
import type { Stone } from '../lib/stones.ts';
import { figuresShown } from './figures-shown.ts';

const none: Stone['figures'] = {
  averageHeartRate: null,
  maxHeartRate: null,
  ascent: null,
  descent: null,
  averageCadence: null,
  maxCadence: null,
  averagePower: null,
  maxPower: null,
  normalizedPower: null,
  minTemperature: null,
  averageTemperature: null,
  maxTemperature: null,
  calories: null,
};

describe("a stone's figures as shown", () => {
  it('shows every figure the watch recorded, in order, formatted', () => {
    const figures = {
      ...none,
      averageHeartRate: 152,
      maxHeartRate: 178,
      ascent: 0,
      averageCadence: 169.6,
      calories: 712,
    };

    expect(figuresShown(figures, 'road-running', 'en')).toEqual([
      { key: 'averageHeartRate', value: '152 bpm' },
      { key: 'maxHeartRate', value: '178 bpm' },
      { key: 'ascent', value: '0 m' },
      { key: 'averageCadence', value: '170 spm' },
      { key: 'calories', value: '712 kcal' },
    ]);
  });

  it('shows nothing when the watch recorded none', () => {
    expect(figuresShown(none, 'strength', 'en')).toEqual([]);
  });

  it('counts steps for walking and hiking, revolutions for a ride', () => {
    const figures = { ...none, averageCadence: 110 };

    expect(figuresShown(figures, 'hiking', 'en')).toEqual([{ key: 'averageCadence', value: '110 spm' }]);
    expect(figuresShown(figures, 'walking', 'en')).toEqual([{ key: 'averageCadence', value: '110 spm' }]);
    expect(figuresShown(figures, 'cycling', 'en')).toEqual([{ key: 'averageCadence', value: '110 rpm' }]);
  });
});
