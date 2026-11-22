import { describe, expect, it } from 'vitest';
import {
  axisTicks,
  chartArea,
  chartDomain,
  chartPath,
  chartStats,
  chartValueAt,
  chartWindow,
  zoomSpan,
} from './chart-line.ts';

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
    expect(axisTicks(3000, [500, 1000], 7, 1800)).toEqual([2000, 2500]);
  });

  it('keep clear of the named start, as of the end', () => {
    expect(axisTicks(3000, [500, 1000], 7, 1900)).toEqual([2500]);
  });
});

describe('the part of the axis a drag zooms in on', () => {
  it('runs between the two places, whichever way the drag went', () => {
    expect(zoomSpan(3000, 1000, [0, 10_000], 25)).toEqual([1000, 3000]);
    expect(zoomSpan(1000, 3000, [0, 10_000], 25)).toEqual([1000, 3000]);
  });

  it('keeps within what is shown', () => {
    expect(zoomSpan(-200, 400, [0, 10_000], 25)).toEqual([0, 400]);
    expect(zoomSpan(9000, 12_000, [2000, 10_000], 25)).toEqual([9000, 10_000]);
  });

  it('opens a slip of the hand out about its middle to the least it zooms to', () => {
    expect(zoomSpan(500, 510, [0, 10_000], 30)).toEqual([490, 520]);
  });

  it('opens out from an end without passing it', () => {
    expect(zoomSpan(0, 5, [0, 10_000], 30)).toEqual([0, 30]);
    expect(zoomSpan(9998, 10_000, [0, 10_000], 30)).toEqual([9970, 10_000]);
  });

  it('never zooms out past what is shown', () => {
    expect(zoomSpan(40, 50, [0, 20], 30)).toEqual([0, 20]);
  });
});

describe('a chart’s figures over part of its axis', () => {
  it('takes the lowest, highest and mean of the points within it', () => {
    const stats = chartStats(
      [
        [
          [0, 100],
          [10, 120],
          [20, 140],
          [30, 200],
        ],
      ],
      [5, 25],
    );
    expect(stats).toEqual({ min: 120, max: 140, avg: 130 });
  });

  it('weighs the mean by how far along each stretch runs', () => {
    const stats = chartStats(
      [
        [
          [0, 100],
          [10, 100],
          [40, 200],
        ],
      ],
      [0, 40],
    );
    // 10 at 100, then 30 averaging 150: 5500 over 40.
    expect(stats?.avg).toBe(137.5);
  });

  it('leaves the gap of a pause out of the mean', () => {
    const stats = chartStats(
      [
        [
          [0, 100],
          [10, 100],
        ],
        [
          [500, 200],
          [510, 200],
        ],
      ],
      [0, 510],
    );
    expect(stats).toEqual({ min: 100, max: 200, avg: 150 });
  });

  it('takes the plain mean of single points', () => {
    expect(chartStats([[[0, 100]], [[50, 200]]], [0, 60])?.avg).toBe(150);
  });

  it('has none where the chart recorded nothing', () => {
    expect(chartStats([[[0, 100]]], [10, 20])).toBeNull();
  });
});
