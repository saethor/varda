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
import { cn } from '@varda/ui/lib/utils';
import { type KeyboardEvent, type PointerEvent, type ReactNode, useMemo, useState } from 'react';
import type { StoneDetail } from '../lib/stones.ts';
import { axisTicks, chartArea, chartDomain, chartPath, chartValueAt, chartWindow } from './chart-line.ts';
import type { ChartAxis } from './chart-series.ts';
import { type ChartKind, type ChartSet, type StoneChart, stoneCharts } from './chart-set.ts';
import { cadenceCountsOf } from './figures-shown.ts';
import { formatForm } from './form-shown.ts';
import type { Span } from './lap-spans.ts';
import { chartMeasure, measureText } from './measure-tint.ts';
import { type Dye, dyeOf } from './sport-dye.ts';
import { StoneSection } from './stone-section.tsx';

/** The drawing box of every chart: as wide as the most points a chart draws, stretched to the column. */
const box = { width: 1000, height: 100 };

/** A part of the charts lit up, a lap pointed at in the laps: where it runs, and what to call it on the axis. */
export type ChartFocus = { span: Span; label: string };

/** How tall a group's charts are: full in their own section, compact where they share the screen with the laps. */
export type ChartDensity = 'full' | 'compact';

/**
 * The stone over its course, from every point the watch recorded: heart rate, pace or speed,
 * elevation, power and cadence, each in its measure's tint, along distance (or moving time when the
 * stone has none), with pauses left out. A chart the watch recorded nothing for isn't drawn, and a
 * stone with nothing to chart has no section at all.
 */
export function StoneCharts({
  stone,
  focus = null,
  density = 'full',
}: {
  stone: Pick<StoneDetail, 'sport' | 'streams'>;
  focus?: ChartFocus | null;
  density?: ChartDensity;
}) {
  const { i18n } = useLingui();
  const set = useMemo(() => stoneCharts(stone), [stone]);
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
      <ChartGroup
        set={set}
        dye={dyeOf(stone.sport)}
        counts={cadenceCountsOf(stone.sport.sport)}
        focus={focus}
        density={density}
      />
    </StoneSection>
  );
}

/**
 * A section's charts stacked on one axis, read together: pointing along any of them (or tapping, or
 * the arrow keys once the group has focus) puts one cursor across them all, and each chart says its
 * value there. The axis under the last chart marks the distance or moving time, and the cursor's place on it.
 */
export function ChartGroup({
  set,
  dye,
  counts,
  focus = null,
  view = null,
  density = 'full',
}: {
  set: ChartSet;
  dye: Dye;
  counts: CadenceCounts;
  /** A part to light up: the rest of each chart falls back. */
  focus?: ChartFocus | null;
  /** The part of the axis to show, zoomed in; the whole of it when none. */
  view?: Span | null;
  density?: ChartDensity;
}) {
  const { t, i18n } = useLingui();
  const [at, setAt] = useState<number | null>(null);
  const { axis, end } = set;
  const [from, to] = view ?? [0, end];
  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const share = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setAt(from + share * (to - from));
  };
  const step = (by: number) => setAt((now) => Math.min(to, Math.max(from, (now ?? from) + by)));
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const by = (to - from) / (event.shiftKey ? 10 : 100);
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        step(by);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        step(-by);
        break;
      case 'Home':
        setAt(from);
        break;
      case 'End':
        setAt(to);
        break;
      case 'Escape':
        setAt(null);
        break;
      default:
        return;
    }
    event.preventDefault();
  };
  // What a screen reader hears as the cursor moves: where it is, and each chart's value there.
  const reading =
    at === null
      ? undefined
      : [
          axisValue(axis, at, i18n.locale),
          ...set.charts.map((chart) => {
            const here = chartValueAt(chart.segments, at);
            const { name, format } = chartKinds[chart.kind];
            return `${i18n._(name)} ${here === null ? '–' : format(here, i18n.locale, counts)}`;
          }),
        ].join(', ');

  return (
    // A slider along the axis: the arrow keys move the cursor, and it reads out each chart's value.
    <div
      tabIndex={0}
      role="slider"
      aria-valuemin={Math.round(from)}
      aria-valuemax={Math.round(to)}
      aria-valuenow={Math.round(at ?? from)}
      aria-valuetext={reading}
      aria-label={
        axis === 'distance'
          ? t`Charts along the distance. Arrow keys move along it.`
          : t`Charts along the moving time. Arrow keys move along it.`
      }
      onKeyDown={onKeyDown}
      onBlur={() => setAt(null)}
      className="flex flex-col rounded-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div
        className="flex touch-pan-y flex-col divide-y"
        onPointerMove={fromPointer}
        onPointerDown={fromPointer}
        onPointerLeave={(event) => event.pointerType === 'mouse' && setAt(null)}
      >
        {set.charts.map((chart) => (
          <Chart
            key={chart.kind}
            chart={chart}
            view={[from, to]}
            counts={counts}
            dye={dye}
            at={at}
            focus={focus?.span ?? null}
            density={density}
          />
        ))}
      </div>
      <AxisMarks axis={axis} view={[from, to]} at={at} focus={focus} locale={i18n.locale} />
    </div>
  );
}

/** One chart: a stitch of its tint and its name, its range (or its value at the cursor), over its line and the area under it. */
function Chart({
  chart,
  view,
  counts,
  dye,
  at,
  focus,
  density,
}: {
  chart: StoneChart;
  view: Span;
  counts: CadenceCounts;
  dye: Dye;
  at: number | null;
  focus: Span | null;
  density: ChartDensity;
}) {
  const { i18n } = useLingui();
  const { name, format } = chartKinds[chart.kind];
  const domain = chartDomain(chart.segments);
  if (domain === null) return null;
  const [low, high] = domain;
  const value = (v: number) => format(v, i18n.locale, counts);
  // The faster end of a pace chart is its fewer seconds, at the top.
  const [top, bottom] = chart.invert ? [low, high] : [high, low];
  // Zoomed in, the line is cut to what shows; its range stays the whole stone's, so laps compare.
  const [from, to] = view;
  const segments = chartWindow(chart.segments, view);
  const shape = { ...box, xMin: from, xMax: to, domain, invert: chart.invert };
  const share = (x: number) => Math.min(100, Math.max(0, ((x - from) / (to - from)) * 100));
  const measure = chartMeasure[chart.kind];
  const tint = measureText(measure, dye);
  const here = at === null ? null : chartValueAt(chart.segments, at);
  // How far down the cursor's dot sits, as a share of the chart's height.
  const depth = here === null ? 0 : Math.min(1, Math.max(0, (here - low) / (high - low)));

  return (
    <figure className={cn('flex flex-col', density === 'full' ? 'gap-1.5 py-3' : 'gap-1 py-1.5 sm:py-2', tint)}>
      <figcaption
        className={cn(
          'flex flex-wrap items-baseline justify-between gap-x-4',
          density === 'full' ? 'text-sm' : 'text-xs',
        )}
      >
        <span className="flex items-baseline gap-2 font-medium text-foreground">
          {/* The tint's key, the same stitch that marks its figures. */}
          <span aria-hidden className={cn('inline-block h-1 w-4 -translate-y-[3px] rounded-xs bg-current', tint)} />
          {i18n._(name)}
        </span>
        {at === null ? (
          <span className="text-muted-foreground tabular-nums">
            {value(bottom)} – {value(top)}
          </span>
        ) : (
          <span className="font-semibold text-foreground tabular-nums">{here === null ? '–' : value(here)}</span>
        )}
      </figcaption>
      <div className={cn('relative', density === 'full' ? 'h-20 sm:h-24' : 'h-8 sm:h-14')}>
        <svg
          viewBox={`0 0 ${box.width} ${box.height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-hidden"
          role="img"
          aria-label={`${i18n._(name)}: ${value(bottom)} – ${value(top)}`}
        >
          <path d={chartArea(segments, shape)} fill="currentColor" opacity={measure === 'ground' ? 0.32 : 0.1} />
          <path
            d={chartPath(segments, shape)}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {focus !== null && <FocusWash left={share(focus[0])} right={share(focus[1])} />}
        {at !== null && (
          <div aria-hidden className="pointer-events-none absolute inset-y-0" style={{ left: `${share(at)}%` }}>
            <div className="absolute inset-y-0 -left-px w-px bg-foreground/70" />
            {here !== null && (
              <div
                className="absolute -left-[4.5px] -mt-[4.5px] size-[9px] rounded-full bg-current ring-2 ring-background"
                style={{ top: `${(chart.invert ? depth : 1 - depth) * 100}%` }}
              />
            )}
          </div>
        )}
      </div>
    </figure>
  );
}

/**
 * The lit part of a chart: either side of it falls back under a wash of the page, and a hairline of
 * ink marks each of its edges that shows.
 */
function FocusWash({ left, right }: { left: number; right: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-y-0 left-0 bg-background/75" style={{ width: `${left}%` }} />
      <div className="absolute inset-y-0 right-0 bg-background/75" style={{ width: `${100 - right}%` }} />
      {left > 0 && <div className="absolute inset-y-0 w-px bg-foreground/30" style={{ left: `${left}%` }} />}
      {right < 100 && <div className="absolute inset-y-0 w-px bg-foreground/30" style={{ left: `${right}%` }} />}
    </div>
  );
}

const distanceSteps = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000];
const timeSteps = [5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200];

/** The axis under a section's charts: round marks from the start, the end with its unit, and the cursor's place in ink. */
function AxisMarks({
  axis,
  view: [from, end],
  at,
  focus,
  locale,
}: {
  axis: ChartAxis;
  view: Span;
  at: number | null;
  focus: ChartFocus | null;
  locale: string;
}) {
  const steps = axis === 'distance' ? distanceSteps : timeSteps;
  const ticks = axisTicks(end, steps, 7, from);
  const stepOf = ticks.length > 1 ? (ticks[1] ?? 0) - (ticks[0] ?? 0) : end - from;
  const decimals = axis === 'distance' ? (stepOf < 100 ? 2 : stepOf < 1000 ? 1 : 0) : 0;
  const km = new Intl.NumberFormat(locale, { maximumFractionDigits: decimals });
  const tick = (x: number) => (axis === 'distance' ? km.format(x / 1000) : formatDuration(x));
  const fraction = (x: number) => Math.min(1, Math.max(0, (x - from) / (end - from)));
  const share = (x: number) => `${fraction(x) * 100}%`;

  return (
    <div aria-hidden className="relative h-6 border-t border-foreground text-xs text-muted-foreground tabular-nums">
      {/* Zoomed in, the start is named too, so the part shown reads from its first mark. */}
      {from > 0 && (
        <span className="absolute top-0 left-0 flex flex-col items-start">
          <span className="h-1.5 w-px bg-foreground" />
          <span className="bg-background pt-0.5 pr-1 text-foreground">{axisValue(axis, from, locale)}</span>
        </span>
      )}
      {ticks.map((x, i) => (
        // On a phone every other mark, so the numbers keep apart and clear of the end.
        <span
          key={x}
          className={cn('absolute top-0 flex flex-col items-start', i % 2 === 1 && 'max-sm:hidden')}
          style={{ left: share(x) }}
        >
          <span className="h-1.5 w-px bg-foreground" />
          <span className={cn('pt-0.5', x > 0 && '-translate-x-1/2')}>{tick(x)}</span>
        </span>
      ))}
      {/* The lit part, in ink along the rule, named under its middle while no cursor is out. */}
      {focus !== null && (
        <span
          className="absolute -top-[2px] h-[3px] bg-foreground"
          style={{ left: share(focus.span[0]), right: `${(1 - fraction(focus.span[1])) * 100}%` }}
        />
      )}
      {focus !== null && at === null && (
        <span
          className="absolute top-1 z-10 -translate-x-1/2 rounded-xs bg-foreground px-1.5 py-0.5 font-medium whitespace-nowrap text-background"
          style={{ left: `clamp(2.5rem, ${share((focus.span[0] + focus.span[1]) / 2)}, calc(100% - 2.5rem))` }}
        >
          {focus.label}
        </span>
      )}
      <span className="absolute top-0 right-0 flex flex-col items-end">
        <span className="h-1.5 w-px bg-foreground" />
        <span className="bg-background pt-0.5 pl-1 text-foreground">{axisValue(axis, end, locale)}</span>
      </span>
      {at !== null && (
        <span
          className="absolute top-1 z-10 -translate-x-1/2 rounded-xs bg-foreground px-1.5 py-0.5 font-medium whitespace-nowrap text-background"
          style={{ left: `clamp(2.5rem, ${share(at)}, calc(100% - 2.5rem))` }}
        >
          {axisValue(axis, at, locale)}
        </span>
      )}
    </div>
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
