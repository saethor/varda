import { describe, expect, it } from 'vitest';
import type { Streams } from './chart-series.ts';
import { stoneCharts } from './chart-set.ts';

const none = {
  distance: null,
  speed: null,
  heartRate: null,
  altitude: null,
  power: null,
  cadence: null,
  temperature: null,
  position: null,
  stepLength: null,
  verticalOscillation: null,
  verticalRatio: null,
  groundContactTime: null,
};

/** Three seconds of a run at 4 m/s, with heart rate, altitude and cadence but no power. */
const run: Streams = {
  ...none,
  offset: [0, 1, 2],
  timerRunning: [true, true, true],
  distance: [0, 4, 8],
  speed: [4, 4, 4],
  heartRate: [140, 141, 142],
  altitude: [20, 21, 22],
  cadence: [170, 171, 172],
};
const running = { sport: 'road-running', group: 'running' } as const;

const kinds = (charts: ReturnType<typeof stoneCharts>) => charts?.charts.map(({ kind }) => kind);

describe("a stone's charts", () => {
  it('draws heart rate, pace, elevation, power and cadence, leaving out those the watch did not record', () => {
    const charts = stoneCharts({ sport: running, streams: run });

    expect(charts).toMatchObject({ axis: 'distance', end: 8 });
    expect(kinds(charts)).toEqual(['heart-rate', 'pace', 'elevation', 'cadence']);
    // 4 m/s is 250 s per kilometre, faster higher.
    expect(charts?.charts[1]).toMatchObject({
      invert: true,
      segments: [
        [
          [0, 250],
          [4, 250],
          [8, 250],
        ],
      ],
    });
  });

  it('draws speed for a ride, in kilometres per hour', () => {
    const charts = stoneCharts({ sport: { sport: 'cycling', group: 'cross-training' }, streams: run });

    expect(charts?.charts[1]).toMatchObject({
      kind: 'speed',
      invert: false,
      segments: [
        [
          [0, 14.4],
          [4, 14.4],
          [8, 14.4],
        ],
      ],
    });
  });

  it('draws only heart rate along moving time for strength', () => {
    const strength = { ...none, offset: [0, 4, 8], timerRunning: [true, true, true], heartRate: [90, 110, 120] };

    const charts = stoneCharts({ sport: { sport: 'strength', group: 'strength' }, streams: strength });

    expect(charts).toMatchObject({ axis: 'moving-time', end: 8 });
    expect(kinds(charts)).toEqual(['heart-rate']);
  });

  it('draws none for a stone without streams, or with nothing to chart', () => {
    expect(stoneCharts({ sport: running, streams: null })).toBeNull();
    expect(stoneCharts({ sport: running, streams: { ...none, offset: [0], timerRunning: [true] } })).toBeNull();
  });
});
