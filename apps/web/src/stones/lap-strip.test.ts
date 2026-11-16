import { describe, expect, it } from 'vitest';
import { lapStrip } from './lap-strip.ts';

const lap = (distance: number | null, movingTime: number) => ({ distance, movingTime });

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

  it('draws nothing for fewer than two laps', () => {
    expect(lapStrip([])).toEqual([]);
    expect(lapStrip([lap(5000, 1500)])).toEqual([]);
  });

  it('draws nothing when a lap has no distance or no moving time, so it has no speed', () => {
    expect(lapStrip([lap(1000, 300), lap(null, 300)])).toEqual([]);
    expect(lapStrip([lap(1000, 300), lap(1000, 0)])).toEqual([]);
  });
});
