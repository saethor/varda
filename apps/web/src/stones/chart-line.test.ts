import { describe, expect, it } from 'vitest';
import { axisTicks, chartArea, chartDomain, chartPath, chartValueAt, chartWindow } from './chart-line.ts';

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

describe('the area under a chart', () => {
  const box = { width: 100, height: 50, xMax: 10, domain: [100, 200] as [number, number] };

  it('closes each line down to the bottom of the box', () => {
    expect(
      chartArea(
        [
          [
            [0, 100],
            [10, 200],
          ],
        ],
        box,
      ),
    ).toBe('M0 50L100 0L100 50L0 50Z');
  });
});

describe('a chart’s value at a place along it', () => {
  const segments: [number, number][][] = [
    [
      [0, 140],
      [10, 150],
    ],
    [
      [30, 160],
      [40, 170],
    ],
  ];

  it('is the recorded point nearest it', () => {
    expect(chartValueAt(segments, 4)).toBe(140);
    expect(chartValueAt(segments, 6)).toBe(150);
    expect(chartValueAt(segments, 36)).toBe(170);
  });

  it('is none where the line breaks for a pause, or past either end', () => {
    expect(chartValueAt(segments, 20)).toBeNull();
    expect(chartValueAt(segments, 41)).toBeNull();
  });
});

describe('the marks along a chart’s axis', () => {
  const steps = [500, 1000, 2000, 5000];

  it('takes the smallest round step that keeps them few, from the start', () => {
    expect(axisTicks(12_240, steps)).toEqual([0, 2000, 4000, 6000, 8000, 10_000]);
  });

  it('leaves out a mark that would crowd the end', () => {
    // 3 km would sit 50 m short of the end.
    expect(axisTicks(3050, steps)).toEqual([0, 500, 1000, 1500, 2000, 2500]);
  });
});

describe('a chart cut to part of its axis', () => {
  it('keeps the points inside and one either side, so the line runs to the edges', () => {
    expect(
      chartWindow(
        [
          [
            [0, 1],
            [10, 2],
            [20, 3],
            [30, 4],
            [40, 5],
          ],
          [[90, 9]],
        ],
        [15, 25],
      ),
    ).toEqual([
      [
        [10, 2],
        [20, 3],
        [30, 4],
      ],
    ]);
  });
});

describe('axis marks from part of the way along', () => {
  it('fall on round numbers past the start', () => {
    expect(axisTicks(3000, [500, 1000], 7, 1900)).toEqual([2000, 2500]);
  });
});
