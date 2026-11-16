import { describe, expect, it } from 'vitest';
import { traceLine } from './trace-line.ts';

describe('the trace line', () => {
  it('draws north up: the northernmost point at the top, the westernmost at the left', () => {
    // Run north, then east.
    const { points } = traceLine([
      [64, -22],
      [64.01, -22],
      [64.01, -21.98],
    ]);

    expect(points[0]).toEqual([0, expect.closeTo(1112, 0)]);
    expect(points[1]).toEqual([0, 0]);
    expect(points[2]?.[1]).toBe(0);
    expect(points[2]?.[0]).toBeGreaterThan(0);
  });

  it('keeps true proportions: a degree of longitude is shorter the further north', () => {
    // At 60° north a degree of longitude is half a degree of latitude on the ground, so this is a square.
    const { width, height } = traceLine([
      [60, 10],
      [60.01, 10.02],
    ]);

    expect(width).toBeCloseTo(height, 0);
  });

  it('gives a line with no width or height some size, so it can still be drawn', () => {
    const { width, height } = traceLine([
      [64, -22],
      [64.01, -22],
    ]);

    expect(width).toBeGreaterThan(0);
    expect(height).toBeCloseTo(1112, 0);
  });
});
