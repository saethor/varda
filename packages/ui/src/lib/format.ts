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

/** A whole-number measure (heart rate, power, cadence, elevation) in `unit`, written the way `locale` writes numbers. */
export function formatMeasure(value: number, unit: string, locale: string, options: UnitOption = {}): string {
  const whole = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  return withUnit(whole.format(value), unit, options);
}
