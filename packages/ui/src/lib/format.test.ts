import { describe, expect, it } from 'vitest';
import { formatDistance, formatDuration } from './format.ts';

describe('formatting a duration', () => {
  it('shows minutes and seconds under an hour', () => {
    expect(formatDuration(930)).toBe('15:30');
    expect(formatDuration(65)).toBe('1:05');
  });

  it('shows hours from an hour on', () => {
    expect(formatDuration(3_725)).toBe('1:02:05');
  });

  it('rounds to the nearest second', () => {
    expect(formatDuration(59.6)).toBe('1:00');
  });
});

describe('formatting a distance', () => {
  it('shows kilometres to two decimals, in the language shown', () => {
    expect(formatDistance(10_234.5, 'en')).toBe('10.23 km');
    expect(formatDistance(3000, 'is')).toBe('3,00 km');
  });
});
