import { t } from '@lingui/core/macro';

// Naming a passkey after where it was made, e.g. "Safari on Mac". The first match wins,
// so browsers built on Chrome come before Chrome, and Chrome before Safari.
const browsers: [pattern: RegExp, name: string][] = [
  [/Edg(e|A|iOS)?\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/SamsungBrowser\//, 'Samsung Internet'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

const operatingSystems: [pattern: RegExp, name: string][] = [
  [/iPhone/, 'iPhone'],
  [/iPad/, 'iPad'],
  [/Android/, 'Android'],
  [/CrOS/, 'ChromeOS'],
  [/Mac OS X|Macintosh/, 'Mac'],
  [/Windows/, 'Windows'],
  [/Linux/, 'Linux'],
];

function firstMatch(browserIdentity: string, candidates: [RegExp, string][]): string | undefined {
  return candidates.find(([pattern]) => pattern.test(browserIdentity))?.[1];
}

/** This browser and operating system, e.g. "Safari on Mac", in the person's language. */
export function thisBrowserAndOperatingSystem(): string {
  const browser = firstMatch(navigator.userAgent, browsers);
  const operatingSystem = firstMatch(navigator.userAgent, operatingSystems);
  if (browser && operatingSystem) return t`${browser} on ${operatingSystem}`;
  return browser ?? operatingSystem ?? t`Passkey`;
}
