import { describe, expect, it } from 'vitest';
import { chartDomain, chartPath } from './chart-line.ts';

describe('the range a chart shows', () => {
  it('spans its values', () => {
    expect(chartDomain([[[0, 140]], [[10, 150]]])).toEqual([140, 150]);
  });

  it('leaves out the odd spike at either end, so one wild second does not flatten the line', () => {
    const steady = Array.from({ length: 100 }, (_, i): [number, number] => [i, 150 + (i % 5)]);

    expect(chartDomain([[...steady, [100, 230], [101, 40]]])).toEqual([150, 154]);
  });

  it('opens a flat line out by one either side', () => {
    expect(chartDomain([[[0, 171]], [[5, 171]]])).toEqual([170, 172]);
  });

  it('is none without values', () => {
    expect(chartDomain([])).toBeNull();
  });
});

describe('the line a chart draws', () => {
  const box = { width: 100, height: 50, xMax: 10, domain: [100, 200] as [number, number] };

  it('draws each segment as its own line, higher values higher', () => {
    expect(
      chartPath(
        [
          [
            [0, 100],
            [5, 200],
          ],
          [[10, 150]],
        ],
        box,
      ),
    ).toBe('M0 50L50 0M100 25');
  });

  it('turns over for pace, faster (fewer seconds) higher', () => {
    expect(chartPath([[[0, 100]]], { ...box, invert: true })).toBe('M0 0');
  });

  it('keeps values outside the range on its edge', () => {
    expect(chartPath([[[0, 300]]], box)).toBe('M0 0');
  });

  it('averages the points falling in the same column, so a long stone draws no more than its width', () => {
    expect(
      chartPath(
        [
          [
            [0, 100],
            [0.01, 200],
            [10, 200],
          ],
        ],
        box,
      ),
    ).toBe('M0 25L100 0');
  });
});
