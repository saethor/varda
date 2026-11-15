import { describe, expect, it } from 'vitest';
import { safeRedirect } from './safe-redirect.ts';

describe('safeRedirect', () => {
  it('keeps a path within Varða', () => {
    expect(safeRedirect('/stones/42?view=laps')).toBe('/stones/42?view=laps');
  });

  it('ignores a protocol-relative address to another site', () => {
    expect(safeRedirect('//evil.example')).toBe('/');
  });

  it('ignores an absolute address', () => {
    expect(safeRedirect('https://evil.example/sign-in')).toBe('/');
  });

  it('ignores a backslash that browsers read as a second slash', () => {
    expect(safeRedirect('/\\evil.example')).toBe('/');
  });

  it('goes home when the redirect is empty', () => {
    expect(safeRedirect('')).toBe('/');
  });

  it('goes home when there is no redirect', () => {
    expect(safeRedirect(undefined)).toBe('/');
  });
});
