import { describe, expect, it } from 'vitest';
import { checkWatchFile } from './check-watch-file.ts';

describe('checking a watch file before it is sent', () => {
  it('lets a .fit file of up to 25 MB through, whatever the case of its extension', () => {
    expect(checkWatchFile({ name: 'Morning Run.FIT', size: 25_000_000 })).toBeNull();
  });

  it('turns away a file that is not named .fit', () => {
    expect(checkWatchFile({ name: 'morning-run.gpx', size: 1000 })).toBe('not-a-fit-file');
  });

  it('turns away a file over 25 MB', () => {
    expect(checkWatchFile({ name: 'morning-run.fit', size: 25_000_001 })).toBe('too-large');
  });
});
