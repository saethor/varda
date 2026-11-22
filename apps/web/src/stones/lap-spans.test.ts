import { describe, expect, it } from 'vitest';
import { lapSpans, spanWithMargin } from './lap-spans.ts';

const start = new Date('2026-11-20T07:00:00Z');
const at = (seconds: number) => new Date(start.getTime() + seconds * 1000);
const streams = {
  offset: [0, 10, 20, 30, 40],
  timerRunning: [true, true, true, true, true],
  distance: [0, 40, null, 120, 160],
} as never;

describe('where each lap runs along the charts', () => {
  const laps = [{ start: at(0) }, { start: at(20) }] as never;

  it('runs from the point its start falls on to where the next lap starts, the last to the end', () => {
    expect(lapSpans({ start, laps, streams }, 'distance')).toEqual([
      [0, 40],
      [40, 160],
    ]);
  });

  it('runs along moving time for a stone without distance', () => {
    expect(lapSpans({ start, laps, streams }, 'moving-time')).toEqual([
      [0, 20],
      [20, 40],
    ]);
  });

  it('is none without streams', () => {
    expect(lapSpans({ start, laps, streams: null }, 'distance')).toBeNull();
  });
});

describe('a span with a margin', () => {
  it('reaches a little either side, never past the ends', () => {
    expect(spanWithMargin([100, 200], 1000, 0.1)).toEqual([90, 210]);
    expect(spanWithMargin([0, 100], 105, 0.1)).toEqual([0, 105]);
  });
});
