import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  type CadenceCounts,
  formatCadence,
  formatDistance,
  formatDuration,
  formatElevation,
  formatHeartRate,
  formatPace,
  formatPower,
  formatSpeed,
} from '@varda/ui/lib/format';
import type { ReactNode } from 'react';
import type { StoneDetail } from '../lib/stones.ts';
import { chartDomain, chartPath } from './chart-line.ts';
import type { ChartAxis } from './chart-series.ts';
import { type ChartKind, type StoneChart, stoneCharts } from './chart-set.ts';
import { cadenceCountsOf } from './figures-shown.ts';
import { formatForm } from './form-shown.ts';
import { StoneSection } from './stone-section.tsx';

/** The drawing box of every chart: as wide as the most points a chart draws, stretched to the column. */
const box = { width: 1000, height: 100 };

/**
 * The stone over its course, from every point the watch recorded: heart rate, pace or speed,
 * elevation, power and cadence, one plain line each, along distance (or moving time when the stone
 * has none), with pauses left out. A chart the watch recorded nothing for isn't drawn, and a stone
 * with nothing to chart has no section at all.
 */
export function StoneCharts({ stone }: { stone: Pick<StoneDetail, 'sport' | 'streams'> }) {
  const { i18n } = useLingui();
  const set = stoneCharts(stone);
  if (set === null) return null;

  return (
    <StoneSection
      id="charts"
      title={<Trans>Charts</Trans>}
      note={
        <>
          <AxisName axis={set.axis} /> · {axisValue(set.axis, set.end, i18n.locale)}
        </>
      }
    >
      <div className="flex flex-col divide-y">
        {set.charts.map((chart) => (
          <Chart key={chart.kind} chart={chart} end={set.end} counts={cadenceCountsOf(stone.sport.sport)} />
        ))}
      </div>
    </StoneSection>
  );
}

/** One chart: its name and range over a plain line. Running form's charts are drawn by this too. */
export function Chart({ chart, end, counts }: { chart: StoneChart; end: number; counts: CadenceCounts }) {
  const { i18n } = useLingui();
  const { name, format } = chartKinds[chart.kind];
  const domain = chartDomain(chart.segments);
  if (domain === null) return null;
  const [low, high] = domain;
  const value = (v: number) => format(v, i18n.locale, counts);
  // The faster end of a pace chart is its fewer seconds, at the top.
  const [top, bottom] = chart.invert ? [low, high] : [high, low];

  return (
    <figure className="flex flex-col gap-1 py-3">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
        <span className="font-medium">{i18n._(name)}</span>
        <span className="text-muted-foreground tabular-nums">
          {value(bottom)} – {value(top)}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${box.width} ${box.height}`}
        preserveAspectRatio="none"
        className="h-20 w-full overflow-visible sm:h-24"
        role="img"
        aria-label={`${i18n._(name)}: ${value(bottom)} – ${value(top)}`}
      >
        <path
          d={chartPath(chart.segments, { ...box, xMax: end, domain, invert: chart.invert })}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </figure>
  );
}

/** Each kind of chart's name, and how it shows a value (given in SI units) in its unit. */
const chartKinds: Record<
  ChartKind,
  { name: MessageDescriptor; format: (value: number, locale: string, counts: CadenceCounts) => string }
> = {
  'heart-rate': { name: msg`Heart rate`, format: (bpm, locale) => formatHeartRate(bpm, locale) },
  // A pace chart holds seconds a metre: that many seconds over one metre.
  'pace-per-kilometre': { name: msg`Pace`, format: (seconds) => formatPace(1, seconds, 'kilometre') },
  'pace-per-100-metres': { name: msg`Pace`, format: (seconds) => formatPace(1, seconds, '100 metres') },
  // A speed chart holds metres a second: that many metres in one second.
  speed: { name: msg`Speed`, format: (metres, locale) => formatSpeed(metres, 1, locale) },
  elevation: { name: msg`Elevation`, format: (metres, locale) => formatElevation(metres, locale) },
  power: { name: msg`Power`, format: (watts, locale) => formatPower(watts, locale) },
  cadence: { name: msg`Cadence`, format: (perMinute, locale, counts) => formatCadence(perMinute, counts, locale) },
  'step-length': { name: msg`Step length`, format: (metres, locale) => formatForm('stepLength', metres, locale) },
  'vertical-oscillation': {
    name: msg`Vertical oscillation`,
    format: (metres, locale) => formatForm('verticalOscillation', metres, locale),
  },
  'vertical-ratio': {
    name: msg`Vertical ratio`,
    format: (percent, locale) => formatForm('verticalRatio', percent, locale),
  },
  'ground-contact-time': {
    name: msg`Ground contact time`,
    format: (seconds, locale) => formatForm('groundContactTime', seconds, locale),
  },
};

export function axisValue(axis: ChartAxis, end: number, locale: string): string {
  return axis === 'distance' ? formatDistance(end, locale) : formatDuration(end);
}

export function AxisName({ axis }: { axis: ChartAxis }): ReactNode {
  return axis === 'distance' ? <Trans>Along the distance</Trans> : <Trans>Along the moving time</Trans>;
}
