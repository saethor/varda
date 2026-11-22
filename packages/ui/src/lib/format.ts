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

/**
 * The unit each kind of value is shown in, by the formatters below: after the value, or in the head
 * of a column whose cells leave it out.
 */
export const units = {
  distance: 'km',
  speed: 'km/h',
  heartRate: 'bpm',
  elevation: 'm',
  power: 'W',
  temperature: '°C',
  calories: 'kcal',
  weight: 'kg',
  height: 'cm',
  stepLength: 'm',
  verticalOscillation: 'mm',
  verticalRatio: '%',
  groundContactTime: 'ms',
} as const;

/** What a pace is the time over: a kilometre, or 100 metres (swimming). */
export type PaceDistance = 'kilometre' | '100 metres';

const paceMetres: Record<PaceDistance, number> = { kilometre: 1000, '100 metres': 100 };
const paceUnits: Record<PaceDistance, string> = { kilometre: '/km', '100 metres': '/100 m' };

/** A pace's unit in a column's head, minutes over its distance: `min/km` or `min/100 m`. */
export const paceHeadUnit = (per: PaceDistance) => `min${paceUnits[per]}`;

/** What a cadence counts: steps (running, walking, hiking) or revolutions. */
export type CadenceCounts = 'steps' | 'revolutions';

/** A cadence's unit: steps (`spm`) or revolutions (`rpm`) a minute. */
export const cadenceUnit = (counts: CadenceCounts) => (counts === 'steps' ? 'spm' : 'rpm');

/** A distance in kilometres to two decimals, written the way `locale` writes numbers. */
export function formatDistance(metres: number, locale: string, options: UnitOption = {}): string {
  const kilometres = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return withUnit(kilometres.format(metres / 1000), units.distance, options);
}

/** A pace: the moving time per kilometre (`5:00 /km`) or per 100 metres (`1:45 /100 m`). */
export function formatPace(metres: number, seconds: number, per: PaceDistance, options: UnitOption = {}): string {
  return withUnit(formatDuration((seconds / metres) * paceMetres[per]), paceUnits[per], options);
}

/** A speed in kilometres per hour to one decimal, written the way `locale` writes numbers. */
export function formatSpeed(metres: number, seconds: number, locale: string, options: UnitOption = {}): string {
  const kmh = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return withUnit(kmh.format((metres / seconds) * 3.6), units.speed, options);
}

/** A whole number with its unit, written the way `locale` writes numbers. */
const formatWhole = (value: number, unit: string, locale: string, options: UnitOption) =>
  withUnit(new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value), unit, options);

/** A heart rate in beats a minute. */
export function formatHeartRate(bpm: number, locale: string, options: UnitOption = {}): string {
  return formatWhole(bpm, units.heartRate, locale, options);
}

/** An elevation, ascent or descent in metres. */
export function formatElevation(metres: number, locale: string, options: UnitOption = {}): string {
  return formatWhole(metres, units.elevation, locale, options);
}

/** A cadence a minute: steps (`spm`) for running, walking and hiking, revolutions (`rpm`) otherwise. */
export function formatCadence(
  perMinute: number,
  counts: CadenceCounts,
  locale: string,
  options: UnitOption = {},
): string {
  return formatWhole(perMinute, cadenceUnit(counts), locale, options);
}

/** A power in watts. */
export function formatPower(watts: number, locale: string, options: UnitOption = {}): string {
  return formatWhole(watts, units.power, locale, options);
}

/** A temperature in degrees Celsius. */
export function formatTemperature(celsius: number, locale: string, options: UnitOption = {}): string {
  return formatWhole(celsius, units.temperature, locale, options);
}

/** Energy in kilocalories. */
export function formatCalories(kcal: number, locale: string, options: UnitOption = {}): string {
  return formatWhole(kcal, units.calories, locale, options);
}

/** A weight in kilograms to one decimal, written the way `locale` writes numbers. */
export function formatWeight(kilograms: number, locale: string, options: UnitOption = {}): string {
  const kg = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return withUnit(kg.format(kilograms), units.weight, options);
}

/** A height, given in metres, in whole centimetres. */
export function formatHeight(metres: number, options: UnitOption = {}): string {
  return withUnit(String(Math.round(metres * 100)), units.height, options);
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
  return formatFixed(metres, 2, units.stepLength, locale, options);
}

/** A running vertical oscillation, given in metres, in whole millimetres. */
export function formatVerticalOscillation(metres: number, locale: string, options: UnitOption = {}): string {
  return formatWhole(metres * 1000, units.verticalOscillation, locale, options);
}

/** A running vertical ratio in percent, to one decimal. */
export function formatVerticalRatio(percent: number, locale: string, options: UnitOption = {}): string {
  return formatFixed(percent, 1, units.verticalRatio, locale, options);
}

/** A running ground contact time, given in seconds, in whole milliseconds. */
export function formatGroundContactTime(seconds: number, locale: string, options: UnitOption = {}): string {
  return formatWhole(seconds * 1000, units.groundContactTime, locale, options);
}
