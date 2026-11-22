import { describe, expect, it } from 'vitest';
import { cairnStones } from './week-cairn.ts';

describe('a week’s cairn', () => {
  it('stacks the logo’s stones, capstone on top, when the week has five', () => {
    const stones = cairnStones(5);
    expect(stones.map((s) => s.width)).toEqual([52, 78, 100, 120, 140]);
    expect(stones.map((s) => s.y)).toEqual([0, 27, 54, 81, 108]);
  });

  it('centres every stone on the widest', () => {
    const [cap, base] = cairnStones(2);
    expect(base?.x).toBe(0);
    expect(cap?.x).toBe((78 - 52) / 2);
  });

  it('widens its base by a step for every stone past five', () => {
    expect(cairnStones(7).map((s) => s.width)).toEqual([52, 78, 100, 120, 140, 150, 160]);
  });

  it('is one stone for the week’s first', () => {
    expect(cairnStones(1)).toEqual([{ x: 0, y: 0, width: 52 }]);
  });
});
