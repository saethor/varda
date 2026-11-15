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

  it.each([
    { languages: ['is-IS', 'en-GB'], expected: 'is' },
    { languages: ['en-US', 'is-IS'], expected: 'en' },
  ])('reads a regional variant as its language: $languages speaks $expected', ({ languages, expected }) => {
    expect(pickLanguage(languages)).toBe(expected);
  });

  it('falls back to English when neither language is asked for', () => {
    expect(pickLanguage(['de-DE', 'fr'])).toBe('en');
  });

  it('falls back to English when the browser lists no languages', () => {
    expect(pickLanguage([])).toBe('en');
  });
});
