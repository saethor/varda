import { defineConfig } from '@lingui/conf';

// English is the source, Icelandic the translation (ADR 0001). `lingui compile --strict`
// fails when an Icelandic translation is missing, so Icelandic never falls back to English.
export default defineConfig({
  sourceLocale: 'en',
  locales: ['en', 'is'],
  fallbackLocales: false,
  catalogs: [{ path: '<rootDir>/src/locales/{locale}', include: ['src'] }],
});
