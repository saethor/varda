import { describe, expect, it } from 'vitest';
import { lapStrip } from './lap-strip.ts';

/** A lap with 10 s stopped. */
const lap = (distance: number | null, movingTime: number) => ({ distance, movingTime, elapsedTime: movingTime + 10 });

describe('the lap strip', () => {
  it('gives each lap a bar as wide as its share of the distance', () => {
    const bars = lapStrip([lap(2000, 600), lap(1000, 300), lap(1000, 300)]);

    expect(bars.map((bar) => bar.width)).toEqual([0.5, 0.25, 0.25]);
  });

  it('makes the fastest lap the tallest and the slowest the shortest, with speeds in between in proportion', () => {
    // 4, 2.5 and 3.25 m/s.
    const bars = lapStrip([lap(1000, 250), lap(1000, 400), lap(1300, 400)]);

    expect(bars.map((bar) => bar.height)).toEqual([1, 0.3, 0.65]);
  });

  it('gives laps run at one speed the same height', () => {
    const bars = lapStrip([lap(1000, 300), lap(2000, 600)]);

    expect(bars.map((bar) => bar.height)).toEqual([0.7, 0.7]);
  });

  it('draws a single lap as one bar across the strip, and no laps as none', () => {
    expect(lapStrip([lap(5000, 1500)])).toEqual([{ width: 1, height: 0.7, hasSpeed: true }]);
    expect(lapStrip([])).toEqual([]);
  });

  it('still draws a bar for every lap when one has no distance, each as wide as its share of the time', () => {
    // Moving 300 s of 310 elapsed, then a 600 s lap with no distance (a rest, a manual lap indoors).
    const bars = lapStrip([lap(1000, 300), { distance: null, movingTime: 600, elapsedTime: 620 }]);

    expect(bars).toEqual([
      { width: 0.333, height: 0.7, hasSpeed: true },
      { width: 0.667, height: 0.7, hasSpeed: false },
    ]);
  });

  it('draws laps with no distance or no moving time without a speed, at the middle height', () => {
    const bars = lapStrip([lap(1000, 250), lap(1000, 400), lap(1000, 0)]);

    expect(bars.map(({ height, hasSpeed }) => ({ height, hasSpeed }))).toEqual([
      { height: 1, hasSpeed: true },
      { height: 0.3, hasSpeed: true },
      { height: 0.7, hasSpeed: false },
    ]);
  });
});
