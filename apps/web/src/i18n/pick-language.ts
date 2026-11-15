export type Language = 'en' | 'is';

export function pickLanguage(languages: readonly string[]): Language {
  for (const tag of languages) {
    const primary = tag.split('-')[0]?.toLowerCase();
    if (primary === 'is' || primary === 'en') return primary;
  }
  return 'en';
}
