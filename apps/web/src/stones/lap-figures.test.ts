import { describe, expect, it } from 'vitest';
import type { Stone } from '../lib/stones.ts';
import { lapFigures, showsIntensity } from './lap-figures.ts';

type Lap = Stone['laps'][number];

const none: Lap['figures'] = {
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

const lap = (figures: Partial<Lap['figures']>, intensity: Lap['intensity'] = null): Lap => ({
  start: new Date('2026-11-02T07:30:00Z'),
  elapsedTime: 300,
  movingTime: 300,
  distance: 1000,
  trigger: 'distance',
  figures: { ...none, ...figures },
  intensity,
  form: null,
});

describe("the laps' figure columns", () => {
  it('has a column for each figure some lap recorded, in order, a lap without it shown as none', () => {
    const laps = [
      lap({ averageHeartRate: 131.4, calories: 92, ascent: 0, averageCadence: 168.6 }),
      lap({ averageHeartRate: 172, maxHeartRate: 181, averagePower: 362 }),
    ];

    expect(lapFigures(laps, 'road-running', 'en')).toEqual([
      { key: 'averageHeartRate', unit: 'bpm', values: ['131', '172'] },
      { key: 'maxHeartRate', unit: 'bpm', values: [null, '181'] },
      { key: 'ascent', unit: 'm', values: ['0', null] },
      { key: 'averageCadence', unit: 'spm', values: ['169', null] },
      { key: 'averagePower', unit: 'W', values: [null, '362'] },
      { key: 'calories', unit: 'kcal', values: ['92', null] },
    ]);
  });

  it("counts a ride's cadence in revolutions", () => {
    expect(lapFigures([lap({ averageCadence: 84 })], 'cycling', 'en')).toEqual([
      { key: 'averageCadence', unit: 'rpm', values: ['84'] },
    ]);
  });

  it('has no columns when no lap recorded any figure', () => {
    expect(lapFigures([lap({}), lap({})], 'road-running', 'en')).toEqual([]);
  });

  it('writes numbers the way the locale does', () => {
    expect(lapFigures([lap({ calories: 1204 })], 'road-running', 'is')[0]?.values).toEqual(['1.204']);
  });
});

describe("the laps' intensity column", () => {
  it('is shown when the watch marked some lap as other than the work', () => {
    expect(showsIntensity([lap({}, 'warm-up'), lap({}, 'active'), lap({}, 'cool-down')])).toBe(true);
    expect(showsIntensity([lap({}, null), lap({}, 'rest')])).toBe(true);
  });

  it('is left out when every lap is the work or unmarked, as on a ride, since it tells nothing apart', () => {
    expect(showsIntensity([lap({}, 'active'), lap({}, 'active')])).toBe(false);
    expect(showsIntensity([lap({}), lap({})])).toBe(false);
  });
});
