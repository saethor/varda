import type { ChartKind } from './chart-set.ts';
import type { FigureKey } from './figures-shown.ts';
import type { Dye } from './sport-dye.ts';

/**
 * What kind of measure a chart or figure is, so it carries the same tint wherever it shows: on its
 * chart's line, and on the stitch over its figures. How fast takes the stone's own dye; the figures
 * of no chart (temperature, energy, the athlete's weight) stay undyed.
 */
export type Measure = 'heart' | 'how-fast' | 'ground' | 'power' | 'stride' | Undyed;

/** Measures with no chart: they group their figures, undyed. */
type Undyed = 'weather' | 'energy' | 'body';

export const chartMeasure: Record<ChartKind, Measure> = {
  'heart-rate': 'heart',
  'pace-per-kilometre': 'how-fast',
  'pace-per-100-metres': 'how-fast',
  speed: 'how-fast',
  elevation: 'ground',
  power: 'power',
  cadence: 'stride',
  'step-length': 'stride',
  'vertical-oscillation': 'stride',
  'vertical-ratio': 'stride',
  'ground-contact-time': 'stride',
};

export const figureMeasure: Record<FigureKey, Measure> = {
  averageHeartRate: 'heart',
  maxHeartRate: 'heart',
  ascent: 'ground',
  descent: 'ground',
  averageCadence: 'stride',
  maxCadence: 'stride',
  averagePower: 'power',
  maxPower: 'power',
  normalizedPower: 'power',
  minTemperature: 'weather',
  averageTemperature: 'weather',
  maxTemperature: 'weather',
  calories: 'energy',
};

/** A measure's colour as `currentColor` (for SVG lines and fills), written out so Tailwind finds them. */
export function measureText(measure: Measure, dye: Dye): string {
  switch (measure) {
    case 'heart':
      return 'text-measure-heart';
    case 'ground':
      return 'text-measure-ground';
    case 'power':
      return 'text-measure-power';
    case 'stride':
      return 'text-measure-stride';
    case 'weather':
    case 'energy':
    case 'body':
      return 'text-foreground/15';
    case 'how-fast':
      return dyeText[dye];
  }
}

const dyeText: Record<Dye, string> = {
  running: 'text-dye-running',
  strength: 'text-dye-strength',
  'cross-training': 'text-dye-cross-training',
  other: 'text-dye-other',
};

/** Groups items that sit next to each other and share a measure, in order. */
export function byMeasure<T>(items: T[], measureOf: (item: T) => Measure): { measure: Measure; items: T[] }[] {
  const groups: { measure: Measure; items: T[] }[] = [];
  for (const item of items) {
    const measure = measureOf(item);
    const last = groups.at(-1);
    if (last?.measure === measure) last.items.push(item);
    else groups.push({ measure, items: [item] });
  }
  return groups;
}
