import { describe, expect, it } from 'vitest';
import type { Streams } from './chart-series.ts';
import { formCharts, stoneCharts } from './chart-set.ts';

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
    expect(kinds(charts)).toEqual(['heart-rate', 'pace-per-kilometre', 'elevation', 'cadence']);
    // 4 m/s is 0.25 s a metre (250 s per kilometre once shown), faster higher.
    expect(charts?.charts[1]).toMatchObject({
      invert: true,
      segments: [
        [
          [0, 0.25],
          [4, 0.25],
          [8, 0.25],
        ],
      ],
    });
  });

  it('draws speed for a ride, in metres per second as recorded', () => {
    const charts = stoneCharts({ sport: { sport: 'cycling', group: 'cross-training' }, streams: run });

    expect(charts?.charts[1]).toMatchObject({
      kind: 'speed',
      invert: false,
      segments: [
        [
          [0, 4],
          [4, 4],
          [8, 4],
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

describe("a run's form charts", () => {
  const withForm: Streams = {
    ...run,
    stepLength: [1.18, 1.2, 1.19],
    verticalOscillation: [0.085, 0.086, 0.087],
    verticalRatio: [7.2, 7.2, 7.3],
    groundContactTime: [0.24, 0.245, 0.25],
  };

  it('draws step length, vertical oscillation, vertical ratio and ground contact time along the distance', () => {
    const charts = formCharts({ sport: running, streams: withForm });

    expect(charts).toMatchObject({ axis: 'distance', end: 8 });
    expect(kinds(charts)).toEqual(['step-length', 'vertical-oscillation', 'vertical-ratio', 'ground-contact-time']);
    expect(charts?.charts[0]?.segments).toEqual([
      [
        [0, 1.18],
        [4, 1.2],
        [8, 1.19],
      ],
    ]);
  });

  it('leaves out a pause, as the other charts do', () => {
    const paused = { ...withForm, offset: [0, 1, 12], timerRunning: [true, true, false] };

    expect(formCharts({ sport: running, streams: paused })?.charts[0]?.segments).toEqual([
      [
        [0, 1.18],
        [4, 1.2],
      ],
    ]);
  });

  it('draws none for a run without form, or for a stone that is not a run', () => {
    expect(formCharts({ sport: running, streams: run })).toBeNull();
    expect(formCharts({ sport: running, streams: null })).toBeNull();
    expect(formCharts({ sport: { sport: 'cycling', group: 'cross-training' }, streams: withForm })).toBeNull();
  });
});
