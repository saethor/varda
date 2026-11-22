import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Button } from '@varda/ui/components/button';
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
import {
  axisTicks,
  type ChartStats,
  chartArea,
  chartDomain,
  chartPath,
  chartStats,
  chartValueAt,
  chartWindow,
  zoomSpan,
} from './chart-line.ts';
import type { ChartAxis } from './chart-series.ts';
import { type ChartKind, type ChartSet, type StoneChart, stoneCharts } from './chart-set.ts';
import { cadenceCountsOf } from './figures-shown.ts';
import { formatForm } from './form-shown.ts';
import type { Span } from './lap-spans.ts';
import { chartMeasure, measureText } from './measure-tint.ts';
import { type Dye, dyeOf } from './sport-dye.ts';
import { fullBleed, StoneSection } from './stone-section.tsx';

/** The drawing box of every chart: as wide as the most points a chart draws, stretched to the column. */
const box = { width: 1000, height: 100 };

/** A part of the charts lit up, a lap pointed at in the laps: where it runs, and what to call it on the axis. */
export type ChartFocus = { span: Span; label: string };

/**
 * How tall a group's charts are: full in their own section, compact where they share the screen
 * with the laps, and expanded when grown to the screen's width.
 */
export type ChartDensity = 'full' | 'compact' | 'expanded';

/** Each density's chart: its spacing, its caption's size, and its drawing's height. */
const chartStyle: Record<ChartDensity, { figure: string; caption: string; height: string }> = {
  compact: { figure: 'gap-1 py-1.5 sm:py-2', caption: 'text-xs', height: 'h-8 sm:h-14' },
  full: { figure: 'gap-1.5 py-3', caption: 'text-sm', height: 'h-20 sm:h-24' },
  expanded: { figure: 'gap-1.5 py-3', caption: 'text-sm', height: 'h-24 sm:h-32 lg:h-40' },
};

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
  const [wide, setWide] = useState(false);
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
      <div className={cn(wide && fullBleed)}>
        <ChartGroup
          set={set}
          dye={dyeOf(stone.sport)}
          counts={cadenceCountsOf(stone.sport.sport)}
          focus={focus}
          density={wide ? 'expanded' : density}
          expand={{ on: wide, onToggle: () => setWide((now) => !now) }}
        />
      </div>
    </StoneSection>
  );
}

/** A chart group grown to the screen's full width, and the toggle that grows it back and forth. */
export type ChartExpand = { on: boolean; onToggle: () => void };

/** The least a drag zooms in on: a few strides, or a few seconds. */
const leastZoom: Record<ChartAxis, number> = { distance: 25, 'moving-time': 10 };

/** How far a mouse must drag (in pixels) before a press becomes a zoom rather than a place for the cursor. */
const dragThreshold = 6;

/**
 * A section's charts stacked on one axis, read together: pointing along any of them (or tapping, or
 * the arrow keys once the group has focus) puts one cursor across them all, and each chart says its
 * value there. The axis under the last chart marks the distance or moving time, and the cursor's place on it.
 *
 * Dragging across the charts with a mouse zooms them all in on the part dragged over, and again
 * within that; on the keyboard Enter marks one end and Enter again the other. A tool row above
 * names the part shown and zooms back out, and with `expand`, grows the group to the screen's width.
 */
export function ChartGroup({
  set,
  dye,
  counts,
  focus = null,
  view = null,
  density = 'full',
  heading = null,
  expand,
  zoom: zoomHeld,
  onZoom,
}: {
  set: ChartSet;
  dye: Dye;
  counts: CadenceCounts;
  /** A part to light up: the rest of each chart falls back. */
  focus?: ChartFocus | null;
  /** The part of the axis to show, zoomed in; the whole of it when none. Zooming out comes back to it. */
  view?: Span | null;
  density?: ChartDensity;
  /** What heads the tool row, on its left: the charts' name, when no section above names them. */
  heading?: ReactNode;
  expand?: ChartExpand | undefined;
  /** The part zoomed in on, when the screen holds it (a lap picked in the laps); the group holds its own otherwise. */
  zoom?: Span | null | undefined;
  onZoom?: ((zoom: Span | null) => void) | undefined;
}) {
  const { t, i18n } = useLingui();
  const [at, setAt] = useState<number | null>(null);
  const [zoomOwn, setZoomOwn] = useState<Span | null>(null);
  const zoom = zoomHeld !== undefined ? zoomHeld : zoomOwn;
  const setZoom = onZoom ?? setZoomOwn;
  // Where a mouse drag began (along the axis, and on the screen), and where the keyboard marked one end.
  const [drag, setDrag] = useState<{ from: number; x: number; moved: boolean } | null>(null);
  const [mark, setMark] = useState<number | null>(null);
  const { axis, end } = set;
  const base: Span = view ?? [0, end];
  const [from, to] = zoom ?? base;
  const zoomTo = (a: number, b: number) => {
    setZoom(zoomSpan(a, b, base, leastZoom[axis]));
    setMark(null);
  };
  const zoomOut = () => {
    setZoom(null);
    setMark(null);
  };
  const placeOf = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const share = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    return from + share * (to - from);
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const place = placeOf(event);
    setAt(place);
    // A finger drags the cursor along, as it always has; a mouse or a pen drags out a part to zoom in on.
    if (event.pointerType === 'touch' || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ from: place, x: event.clientX, moved: false });
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    setAt(placeOf(event));
    if (drag !== null && !drag.moved && Math.abs(event.clientX - drag.x) >= dragThreshold) {
      setDrag({ ...drag, moved: true });
    }
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (drag?.moved) zoomTo(drag.from, placeOf(event));
    setDrag(null);
  };
  // Enter marks one end where the cursor is, and Enter again zooms in on the part between.
  const markOrZoom = () => {
    const here = at ?? from;
    if (mark !== null) return zoomTo(mark, here);
    setAt(here);
    setMark(here);
  };
  // Escape steps back one thing at a time: the marked end, then the cursor, then the zoom.
  const stepBack = () => {
    if (mark !== null) setMark(null);
    else if (at !== null) setAt(null);
    else if (zoom !== null) zoomOut();
    else return false;
    return true;
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moved = cursorAfter(event.key, event.shiftKey, at, [from, to]);
    if (moved !== undefined) setAt(moved);
    else if (event.key === 'Enter' || event.key === ' ') markOrZoom();
    else if (event.key !== 'Escape' || !stepBack()) return;
    event.preventDefault();
  };
  // The part being marked out: by a mouse dragging, or between the keyboard's mark and its cursor.
  const band = markedPart(drag?.moved ? drag.from : mark, at);
  // The part each chart gives its figures for: the one being marked out, or else the one zoomed in on.
  const part: Span | null = band ?? (zoom !== null || view !== null ? [from, to] : null);
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
    <div className="flex flex-col gap-1.5">
      <ChartTools
        heading={heading}
        axis={axis}
        zoom={zoom === null ? null : [from, to]}
        marking={mark !== null}
        onZoomOut={zoomOut}
        expand={expand}
        density={density}
      />
      {/* A slider along the axis: the arrow keys move the cursor, and it reads out each chart's value. */}
      <div
        tabIndex={0}
        role="slider"
        aria-valuemin={Math.round(from)}
        aria-valuemax={Math.round(to)}
        aria-valuenow={Math.round(at ?? from)}
        aria-valuetext={reading}
        aria-label={
          axis === 'distance'
            ? t`Charts along the distance. Arrow keys move along it; Enter marks where to zoom in from, and Enter again where to.`
            : t`Charts along the moving time. Arrow keys move along it; Enter marks where to zoom in from, and Enter again where to.`
        }
        onKeyDown={onKeyDown}
        // A double click zooms back out to the whole.
        onDoubleClick={zoomOut}
        onBlur={() => {
          setAt(null);
          setMark(null);
        }}
        className="flex flex-col rounded-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <div
          className={cn('flex touch-pan-y flex-col divide-y select-none', drag?.moved && 'cursor-ew-resize')}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setDrag(null)}
          onPointerLeave={(event) => event.pointerType === 'mouse' && drag === null && setAt(null)}
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
              band={band}
              part={part}
              density={density}
            />
          ))}
        </div>
        <AxisMarks axis={axis} view={[from, to]} at={at} focus={focus} band={band} locale={i18n.locale} />
      </div>
    </div>
  );
}

/** The part between one end marked (by a drag begun, or Enter) and the cursor, while both are out. */
function markedPart(end: number | null, at: number | null): Span | null {
  return end === null || at === null ? null : [Math.min(end, at), Math.max(end, at)];
}

/**
 * Where a key moves the cursor, within the part shown: along by a hundredth of it (a tenth with
 * Shift), or to either end. Undefined for a key that doesn't move it.
 */
function cursorAfter(key: string, shift: boolean, at: number | null, [from, to]: Span): number | undefined {
  const by = (to - from) / (shift ? 10 : 100);
  const along = (step: number) => Math.min(to, Math.max(from, (at ?? from) + step));
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return along(by);
    case 'ArrowLeft':
    case 'ArrowDown':
      return along(-by);
    case 'Home':
      return from;
    case 'End':
      return to;
    default:
      return undefined;
  }
}

/**
 * The row above a chart group: its heading, if it has one, then what the group is zoomed in on with
 * a way back out (or, to a mouse, a word on how to zoom), and the toggle that grows it to the
 * screen's width. The row keeps its height whichever it shows, so the charts never jump.
 */
function ChartTools({
  heading,
  axis,
  zoom,
  marking,
  onZoomOut,
  expand,
  density,
}: {
  heading: ReactNode;
  axis: ChartAxis;
  zoom: Span | null;
  marking: boolean;
  onZoomOut: () => void;
  expand: ChartExpand | undefined;
  density: ChartDensity;
}) {
  const { i18n } = useLingui();
  return (
    <div
      className={cn(
        'flex min-h-6 flex-wrap items-center justify-between gap-x-4 gap-y-1 tabular-nums',
        density === 'compact' ? 'text-xs' : 'text-sm',
      )}
    >
      <div className="min-w-0 text-muted-foreground">{heading}</div>
      <div className="ml-auto flex items-center gap-1">
        <p aria-live="polite" className="flex items-center gap-1">
          {zoom !== null ? (
            <>
              <span className="pr-1 text-foreground">
                {axisValue(axis, zoom[0], i18n.locale)} – {axisValue(axis, zoom[1], i18n.locale)}
              </span>
              <Button variant="ghost" size="xs" onClick={onZoomOut}>
                <ZoomOutMark />
                <Trans>Zoom out</Trans>
              </Button>
            </>
          ) : marking ? (
            <span className="pr-1 text-muted-foreground">
              <Trans>Move to the other end, then Enter</Trans>
            </span>
          ) : (
            // Said to a mouse only: a finger drags the cursor, and the keyboard is told in the slider's name.
            <span className="hidden pr-1 text-muted-foreground pointer-fine:inline">
              <Trans>Drag across to zoom in</Trans>
            </span>
          )}
        </p>
        {expand !== undefined && (
          <Button
            variant="ghost"
            size="xs"
            aria-pressed={expand.on}
            onClick={expand.onToggle}
            className="aria-pressed:bg-accent"
          >
            <WidthMark wide={expand.on} />
            <Trans>Full width</Trans>
          </Button>
        )}
      </div>
    </div>
  );
}

/** Two arrows apart (grow to the full width) or together (come back in), drawn on the 12px grid of the small buttons. */
function WidthMark({ wide }: { wide: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {wide ? (
        <path d="M1 6h3.5M2.75 4.25 4.5 6 2.75 7.75M11 6H7.5M9.25 4.25 7.5 6l1.75 1.75M6 2v8" />
      ) : (
        <path d="M4.5 6H1M2.75 4.25 1 6l1.75 1.75M7.5 6H11M9.25 4.25 11 6 9.25 7.75M6 2v8" />
      )}
    </svg>
  );
}

/** A span's two ends pulled apart again: zooming back out. */
function ZoomOutMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 2.5v7M11 2.5v7M3 6h6M4.5 4.5 3 6l1.5 1.5M7.5 4.5 9 6 7.5 7.5" />
    </svg>
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
  band,
  part,
  density,
}: {
  chart: StoneChart;
  view: Span;
  counts: CadenceCounts;
  dye: Dye;
  at: number | null;
  focus: Span | null;
  band: Span | null;
  /** The part to give the lowest, mean and highest values of, in place of the whole stone's range. */
  part: Span | null;
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
  // Grown to the screen's width, a chart draws twice the columns so its line keeps its grain.
  const drawn = density === 'expanded' ? { ...box, width: box.width * 2 } : box;
  const shape = { ...drawn, xMin: from, xMax: to, domain, invert: chart.invert };
  const share = (x: number) => Math.min(100, Math.max(0, ((x - from) / (to - from)) * 100));
  const measure = chartMeasure[chart.kind];
  const tint = measureText(measure, dye);
  const here = at === null ? null : chartValueAt(chart.segments, at);
  // How far down the cursor's dot sits, as a share of the chart's height.
  const depth = here === null ? 0 : Math.min(1, Math.max(0, (here - low) / (high - low)));

  return (
    <figure className={cn('flex flex-col', chartStyle[density].figure, tint)}>
      <figcaption className={cn('flex flex-wrap items-baseline justify-between gap-x-4', chartStyle[density].caption)}>
        <span className="flex items-baseline gap-2 font-medium text-foreground">
          {/* The tint's key, the same stitch that marks its figures. */}
          <span aria-hidden className={cn('inline-block h-1 w-4 -translate-y-[3px] rounded-xs bg-current', tint)} />
          {i18n._(name)}
        </span>
        <ChartReading
          here={at !== null && band === null ? here : undefined}
          stats={part === null ? undefined : chartStats(chart.segments, part)}
          range={[bottom, top]}
          value={value}
        />
      </figcaption>
      <div className={cn('relative', chartStyle[density].height)}>
        <svg
          viewBox={`0 0 ${drawn.width} ${drawn.height}`}
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
        {band !== null && <ZoomBand left={share(band[0])} right={share(band[1])} />}
        {at !== null && (
          <ChartCursor left={share(at)} top={here === null ? null : (chart.invert ? depth : 1 - depth) * 100} />
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

/**
 * What a chart's caption says at its other end: its value at the cursor (`here`, null in a gap,
 * undefined with no cursor out); else, with a part marked out or zoomed in on, that part's figures
 * (`stats`, null when nothing was recorded there);
 * else the whole stone's range.
 */
function ChartReading({
  here,
  stats,
  range: [bottom, top],
  value,
}: {
  here: number | null | undefined;
  stats: ChartStats | null | undefined;
  range: [number, number];
  value: (v: number) => string;
}) {
  if (here !== undefined) {
    return <span className="font-semibold text-foreground tabular-nums">{here === null ? '–' : value(here)}</span>;
  }
  // A part the watch recorded nothing in for this chart says so rather than fall back to the whole.
  if (stats === null) return <span className="text-muted-foreground">–</span>;
  if (stats !== undefined) return <PartFigures stats={stats} value={value} />;
  return (
    <span className="text-muted-foreground tabular-nums">
      {value(bottom)} – {value(top)}
    </span>
  );
}

/**
 * A chart's figures over the part marked out or zoomed in on: its lowest, mean and highest values,
 * each named, in ink so they read as the part's own rather than the stone's range.
 */
function PartFigures({ stats, value }: { stats: ChartStats; value: (v: number) => string }) {
  const figures = [
    { key: 'min', label: <Trans>Min</Trans>, value: stats.min },
    { key: 'avg', label: <Trans>Avg</Trans>, value: stats.avg },
    { key: 'max', label: <Trans>Max</Trans>, value: stats.max },
  ];
  return (
    <dl className="flex flex-wrap items-baseline gap-x-3 tabular-nums">
      {figures.map((figure) => (
        <div key={figure.key} className="flex items-baseline gap-1">
          <dt className="text-muted-foreground">{figure.label}</dt>
          <dd className="font-medium whitespace-nowrap text-foreground">{value(figure.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The cursor across a chart: a line of ink, and a dot in the chart's tint where its line crosses (none in a gap). */
function ChartCursor({ left, top }: { left: number; top: number | null }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-0" style={{ left: `${left}%` }}>
      <div className="absolute inset-y-0 -left-px w-px bg-foreground/70" />
      {top !== null && (
        <div
          className="absolute -left-[4.5px] -mt-[4.5px] size-[9px] rounded-full bg-current ring-2 ring-background"
          style={{ top: `${top}%` }}
        />
      )}
    </div>
  );
}

/**
 * The part being dragged out to zoom in on: a veil of ink over it, edged in ink, so it reads as
 * picked up rather than lit (lighting is a lap's).
 */
function ZoomBand({ left, right }: { left: number; right: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 border-x border-foreground/60 bg-foreground/8"
      style={{ left: `${left}%`, width: `${right - left}%` }}
    />
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
  band,
  locale,
}: {
  axis: ChartAxis;
  view: Span;
  at: number | null;
  focus: ChartFocus | null;
  band: Span | null;
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
      {focus !== null && <AxisRun left={share(focus.span[0])} right={share(focus.span[1])} />}
      {focus !== null && at === null && (
        <AxisChip at={share((focus.span[0] + focus.span[1]) / 2)}>{focus.label}</AxisChip>
      )}
      <span className="absolute top-0 right-0 flex flex-col items-end">
        <span className="h-1.5 w-px bg-foreground" />
        <span className="bg-background pt-0.5 pl-1 text-foreground">{axisValue(axis, end, locale)}</span>
      </span>
      <AxisPlace axis={axis} at={at} band={band} share={share} locale={locale} />
    </div>
  );
}

/**
 * Where the cursor is on the axis, in a chip; or, while a part is being marked out, that part in
 * ink along the rule, named end to end under its middle.
 */
function AxisPlace({
  axis,
  at,
  band,
  share,
  locale,
}: {
  axis: ChartAxis;
  at: number | null;
  band: Span | null;
  share: (x: number) => string;
  locale: string;
}) {
  if (band !== null) {
    return (
      <>
        <AxisRun left={share(band[0])} right={share(band[1])} />
        <AxisChip at={share((band[0] + band[1]) / 2)} room="5rem">
          {axisValue(axis, band[0], locale)} – {axisValue(axis, band[1], locale)}
        </AxisChip>
      </>
    );
  }
  return at === null ? null : <AxisChip at={share(at)}>{axisValue(axis, at, locale)}</AxisChip>;
}

/** A run of the axis rule thickened to ink, from `left` to `right` (shares of its width, as CSS). */
function AxisRun({ left, right }: { left: string; right: string }) {
  return (
    <span className="absolute -top-[2px] h-[3px] bg-foreground" style={{ left, width: `calc(${right} - ${left})` }} />
  );
}

/** A Svart chip under the axis rule, centred on `at` but kept `room` clear of either end. */
function AxisChip({ at, room = '2.5rem', children }: { at: string; room?: string; children: ReactNode }) {
  return (
    <span
      className="absolute top-1 z-10 -translate-x-1/2 rounded-xs bg-foreground px-1.5 py-0.5 font-medium whitespace-nowrap text-background"
      style={{ left: `clamp(${room}, ${at}, calc(100% - ${room}))` }}
    >
      {children}
    </span>
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
