import { describe, expect, it } from 'vitest';
import { pickLanguage } from './pick-language.ts';

describe('pickLanguage', () => {
  it('speaks Icelandic to a browser that asks for Icelandic first', () => {
    expect(pickLanguage(['is', 'en'])).toBe('is');
  });

  it('follows the first choice when English is listed before Icelandic', () => {
    expect(pickLanguage(['en', 'is'])).toBe('en');
  });

  it('skips languages Varða does not speak and takes the first one it does', () => {
    expect(pickLanguage(['de', 'en', 'is'])).toBe('en');
  });

  it('speaks Icelandic to a browser that asks for a regional variant of it', () => {
    expect(pickLanguage(['is-IS', 'en-GB'])).toBe('is');
  });

  it('follows a regional variant of English listed before Icelandic', () => {
    expect(pickLanguage(['en-US', 'is-IS'])).toBe('en');
  });

  it('falls back to English when neither language is asked for', () => {
    expect(pickLanguage(['de-DE', 'fr'])).toBe('en');
  });

  it('falls back to English when the browser lists no languages', () => {
    expect(pickLanguage([])).toBe('en');
  });
});
