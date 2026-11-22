import { describe, expect, it } from 'vitest';
import { chartAxisOf, chartSegments, movingTimesOf, paceOf } from './chart-series.ts';

/** Five points a second apart, then a 10 s pause, then two more: 20 m a second, 100 m in all after the pause. */
const run = {
  offset: [0, 1, 2, 3, 13, 14, 15],
  timerRunning: [true, true, true, true, false, true, true],
  distance: [0, 20, 40, 60, 60, 80, 100],
  heartRate: [100, 110, null, 120, 121, 125, 130],
};

describe('the axis a chart runs along', () => {
  it('is distance for a stone whose watch recorded distance', () => {
    expect(chartAxisOf(run)).toBe('distance');
  });

  it('is moving time for a stone without distance', () => {
    expect(chartAxisOf({ ...run, distance: null })).toBe('moving-time');
  });

  it('is moving time when the distance never moved from 0', () => {
    expect(chartAxisOf({ ...run, distance: [0, 0, 0, 0, 0, 0, 0] })).toBe('moving-time');
  });
});

describe('moving time along the streams', () => {
  it('counts the seconds the timer ran, leaving out each pause', () => {
    expect(movingTimesOf(run)).toEqual([0, 1, 2, 3, 3, 4, 5]);
  });
});

describe('the lines a chart draws', () => {
  it('leaves out paused points and points the watch missed, breaking the line at each', () => {
    expect(chartSegments(run, 'distance', run.heartRate)).toEqual([
      [
        [0, 100],
        [20, 110],
      ],
      [[60, 120]],
      [
        [80, 125],
        [100, 130],
      ],
    ]);
  });

  it('runs along moving time, so a pause takes no room', () => {
    const strength = { ...run, distance: null };

    expect(chartSegments(strength, 'moving-time', run.heartRate)).toEqual([
      [
        [0, 100],
        [1, 110],
      ],
      [[3, 120]],
      [
        [4, 125],
        [5, 130],
      ],
    ]);
  });

  it('draws nothing for a channel with no value at a point the timer ran', () => {
    expect(chartSegments(run, 'distance', [null, null, null, null, 5, null, null])).toEqual([]);
  });
});

describe('pace from speed', () => {
  it('is the seconds per kilometre or per 100 metres, and none when standing still', () => {
    expect(paceOf([4, 2.5, 0, null], 1000)).toEqual([250, 400, null, null]);
    expect(paceOf([1], 100)).toEqual([100]);
  });
});
