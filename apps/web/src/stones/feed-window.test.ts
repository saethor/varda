import { describe, expect, it } from 'vitest';
import { feedWindow } from './feed-window.ts';

describe('the list window', () => {
  it('first loads this week so far and the 3 whole weeks before it', () => {
    // 2026-11-18 is a Wednesday.
    expect(feedWindow('2026-11-18', 0)).toEqual({ from: '2026-10-26', to: '2026-11-18' });
  });

  it('starts this week on the day itself when today is Monday', () => {
    expect(feedWindow('2026-11-16', 0)).toEqual({ from: '2026-10-26', to: '2026-11-16' });
  });

  it('shows the 4 whole weeks before the last window next, with no day in both or missed', () => {
    expect(feedWindow('2026-11-18', 1)).toEqual({ from: '2026-09-28', to: '2026-10-25' });
  });

  it('counts calendar days across a year change', () => {
    // 2026-01-10 is a Saturday; its week starts on Monday 5 January.
    expect(feedWindow('2026-01-10', 0)).toEqual({ from: '2025-12-15', to: '2026-01-10' });
  });
});
