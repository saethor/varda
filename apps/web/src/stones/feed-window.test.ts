import { describe, expect, it } from 'vitest';
import { feedWindow } from './feed-window.ts';

describe('the feed window', () => {
  it('first loads the 4 weeks up to and including today', () => {
    expect(feedWindow('2026-11-16', 0)).toEqual({ from: '2026-10-20', to: '2026-11-16' });
  });

  it('shows the 4 weeks before the last window next, with no day in both or missed', () => {
    expect(feedWindow('2026-11-16', 1)).toEqual({ from: '2026-09-22', to: '2026-10-19' });
  });

  it('counts calendar days across a year change', () => {
    expect(feedWindow('2026-01-10', 0)).toEqual({ from: '2025-12-14', to: '2026-01-10' });
  });
});
