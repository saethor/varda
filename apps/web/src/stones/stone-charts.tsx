import { Trans, useLingui } from '@lingui/react/macro';
import {
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
import { steppingSports } from './figures-shown.ts';
import { formatForm } from './form-shown.ts';

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
  const steps = steppingSports.includes(stone.sport.sport);

  return (
    <section aria-labelledby="charts" className="flex flex-col gap-3">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-foreground pb-2">
        <h2 id="charts" className="text-lg font-semibold">
          <Trans>Charts</Trans>
        </h2>
        <p className="text-sm text-muted-foreground tabular-nums">
          <AxisName axis={set.axis} /> · {axisValue(set.axis, set.end, i18n.locale)}
        </p>
      </header>
      <div className="flex flex-col divide-y">
        {set.charts.map((chart) => (
          <Chart key={chart.kind} chart={chart} end={set.end} steps={steps} />
        ))}
      </div>
    </section>
  );
}

/** One chart: its name and range over a plain line. Running form's charts are drawn by this too. */
export function Chart({ chart, end, steps }: { chart: StoneChart; end: number; steps: boolean }) {
  const { i18n } = useLingui();
  const name = useChartName(chart.kind);
  const domain = chartDomain(chart.segments);
  if (domain === null) return null;
  const [low, high] = domain;
  const value = (v: number) => shownValue(chart, v, steps, i18n.locale);
  // The faster end of a pace chart is its fewer seconds, at the top.
  const [top, bottom] = chart.invert ? [low, high] : [high, low];

  return (
    <figure className="flex flex-col gap-1 py-3">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground tabular-nums">
          {value(bottom)} – {value(top)}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${box.width} ${box.height}`}
        preserveAspectRatio="none"
        className="h-20 w-full overflow-visible sm:h-24"
        role="img"
        aria-label={`${name}: ${value(bottom)} – ${value(top)}`}
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

/** A chart's value as the stone screen shows it, in its unit. */
function shownValue(chart: StoneChart, value: number, steps: boolean, locale: string): string {
  switch (chart.kind) {
    case 'heart-rate':
      return formatHeartRate(value, locale);
    case 'pace':
      return formatPace(chart.per ?? 1000, value, chart.per ?? 1000);
    case 'speed':
      // The chart holds km/h: as metres over seconds, that is the value in metres per 3.6 s.
      return formatSpeed(value, 3.6, locale);
    case 'elevation':
      return formatElevation(value, locale);
    case 'power':
      return formatPower(value, locale);
    case 'cadence':
      return formatCadence(value, steps ? 'steps' : 'revolutions', locale);
    case 'step-length':
      return formatForm('stepLength', value, locale);
    case 'vertical-oscillation':
      return formatForm('verticalOscillation', value, locale);
    case 'vertical-ratio':
      return formatForm('verticalRatio', value, locale);
    case 'ground-contact-time':
      return formatForm('groundContactTime', value, locale);
  }
}

export function axisValue(axis: ChartAxis, end: number, locale: string): string {
  return axis === 'distance' ? formatDistance(end, locale) : formatDuration(end);
}

export function AxisName({ axis }: { axis: ChartAxis }): ReactNode {
  return axis === 'distance' ? <Trans>Along the distance</Trans> : <Trans>Along the moving time</Trans>;
}

function useChartName(kind: ChartKind): string {
  const { t } = useLingui();
  switch (kind) {
    case 'heart-rate':
      return t`Heart rate`;
    case 'pace':
      return t`Pace`;
    case 'speed':
      return t`Speed`;
    case 'elevation':
      return t`Elevation`;
    case 'power':
      return t`Power`;
    case 'cadence':
      return t`Cadence`;
    case 'step-length':
      return t`Step length`;
    case 'vertical-oscillation':
      return t`Vertical oscillation`;
    case 'vertical-ratio':
      return t`Vertical ratio`;
    case 'ground-contact-time':
      return t`Ground contact time`;
  }
}
