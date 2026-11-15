import { i18n } from '@lingui/core';
import { messages as en } from '../locales/en.po';
import { messages as is } from '../locales/is.po';
import { pickLanguage } from './pick-language.ts';

/**
 * Speaks the browser's first choice of Icelandic or English, and tells assistive
 * technology which one through `<html lang>`. No picker and no stored preference.
 */
export function activateBrowserLanguage(): typeof i18n {
  const language = pickLanguage(navigator.languages);
  i18n.loadAndActivate({ locale: language, messages: { en, is }[language] });
  document.documentElement.lang = language;
  return i18n;
}
