import { describe, expect, it } from 'vitest';
import { sportGroupOf, sports } from './sport.ts';

describe('sport', () => {
  it('treats every kind of running as running', () => {
    expect(sportGroupOf('treadmill-running')).toBe('running');
    expect(sportGroupOf('trail-running')).toBe('running');
  });

  it('counts other sports as cross-training', () => {
    expect(sportGroupOf('cycling')).toBe('cross-training');
    expect(sportGroupOf('other')).toBe('cross-training');
  });

  it('gives every sport a group', () => {
    for (const sport of sports) {
      expect(sportGroupOf(sport)).toBeDefined();
    }
  });
});
