// The one set of formatters for values shown to a person (CODING_STANDARDS.md, Units and display).
// Values come in SI units: seconds and metres.

/** A duration as `m:ss`, or `h:mm:ss` from an hour on. */
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`;
}

/**
 * Whether a value carries its unit. Leave it out only where the unit is already shown nearby, as in a
 * table whose column header names it.
 */
export interface UnitOption {
  unit?: boolean;
}

const withUnit = (value: string, unit: string, { unit: shown = true }: UnitOption) =>
  shown ? `${value} ${unit}` : value;

/** A distance in kilometres to two decimals, written the way `locale` writes numbers. */
export function formatDistance(metres: number, locale: string, options: UnitOption = {}): string {
  const kilometres = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return withUnit(kilometres.format(metres / 1000), 'km', options);
}

/** A pace: the moving time per kilometre (`5:00 /km`) or per 100 metres (`1:45 /100 m`). */
export function formatPace(metres: number, seconds: number, per: 1000 | 100, options: UnitOption = {}): string {
  return withUnit(formatDuration((seconds / metres) * per), per === 1000 ? '/km' : '/100 m', options);
}

/** A speed in kilometres per hour to one decimal, written the way `locale` writes numbers. */
export function formatSpeed(metres: number, seconds: number, locale: string, options: UnitOption = {}): string {
  const kmh = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return withUnit(kmh.format((metres / seconds) * 3.6), 'km/h', options);
}

/** A whole number with its unit, written the way `locale` writes numbers. */
const formatWhole = (value: number, unit: string, locale: string, options: UnitOption) =>
  withUnit(new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value), unit, options);

/** A heart rate in beats a minute. */
export function formatHeartRate(bpm: number, locale: string, options: UnitOption = {}): string {
  return formatWhole(bpm, 'bpm', locale, options);
}

/** An elevation, ascent or descent in metres. */
export function formatElevation(metres: number, locale: string, options: UnitOption = {}): string {
  return formatWhole(metres, 'm', locale, options);
}

/** A cadence a minute: steps (`spm`) for running, walking and hiking, revolutions (`rpm`) otherwise. */
export function formatCadence(
  perMinute: number,
  counts: 'steps' | 'revolutions',
  locale: string,
  options: UnitOption = {},
): string {
  return formatWhole(perMinute, counts === 'steps' ? 'spm' : 'rpm', locale, options);
}

/** A power in watts. */
export function formatPower(watts: number, locale: string, options: UnitOption = {}): string {
  return formatWhole(watts, 'W', locale, options);
}

/** A temperature in degrees Celsius. */
export function formatTemperature(celsius: number, locale: string, options: UnitOption = {}): string {
  return formatWhole(celsius, '°C', locale, options);
}

/** Energy in kilocalories. */
export function formatCalories(kcal: number, locale: string, options: UnitOption = {}): string {
  return formatWhole(kcal, 'kcal', locale, options);
}

/** A weight in kilograms to one decimal, written the way `locale` writes numbers. */
export function formatWeight(kilograms: number, locale: string, options: UnitOption = {}): string {
  const kg = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return withUnit(kg.format(kilograms), 'kg', options);
}

/** A height, given in metres, in whole centimetres. */
export function formatHeight(metres: number, options: UnitOption = {}): string {
  return withUnit(String(Math.round(metres * 100)), 'cm', options);
}

/** A number to exactly `digits` decimals with its unit, written the way `locale` writes numbers. */
const formatFixed = (value: number, digits: number, unit: string, locale: string, options: UnitOption) =>
  withUnit(
    new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value),
    unit,
    options,
  );

/** A running step length, given in metres, to two decimals. */
export function formatStepLength(metres: number, locale: string, options: UnitOption = {}): string {
  return formatFixed(metres, 2, 'm', locale, options);
}

/** A running vertical oscillation, given in metres, in whole millimetres. */
export function formatVerticalOscillation(metres: number, locale: string, options: UnitOption = {}): string {
  return formatWhole(metres * 1000, 'mm', locale, options);
}

/** A running vertical ratio in percent, to one decimal. */
export function formatVerticalRatio(percent: number, locale: string, options: UnitOption = {}): string {
  return formatFixed(percent, 1, '%', locale, options);
}

/** A running ground contact time, given in seconds, in whole milliseconds. */
export function formatGroundContactTime(seconds: number, locale: string, options: UnitOption = {}): string {
  return formatWhole(seconds * 1000, 'ms', locale, options);
}
