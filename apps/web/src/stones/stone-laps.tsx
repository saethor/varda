import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { formatDistance, formatDuration, units } from '@varda/ui/lib/format';
import { cn } from '@varda/ui/lib/utils';
import { Fragment, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import type { Stone } from '../lib/stones.ts';
import { lapFigures, showsIntensity } from './lap-figures.ts';
import { lapEvery, lapStrip } from './lap-strip.ts';
import { paceOrSpeed } from './pace-or-speed.ts';
import { dyeFill, dyeOf } from './sport-dye.ts';
import { FigureLabel } from './stone-figures.tsx';
import { ColumnUnit, StoneSection } from './stone-section.tsx';

/**
 * The stone's laps: a profile of them, then the table of their figures. Pointing at a lap in either
 * makes it the one active lap: its bar stays full, the others fall back, and its row lights. A
 * mouse points, a finger taps (the lap holds until another is tapped), and the keyboard focuses a
 * row. The active lap is held by the screen, so the charts can light it up too.
 *
 * With `charts`, from 1024px the profile stands upright beside them, a row per lap however many
 * there are, and the table runs the full width below; narrower, the charts sit between the
 * profile (across the width, a block per lap) and the table.
 *
 * With `lens`, a lap's row opens (a click, a tap, or Enter) onto what `lens` draws for that lap.
 */
export function StoneLaps({
  stone,
  active,
  onActive,
  charts,
  lens,
}: {
  stone: Stone;
  active: number | null;
  onActive: (lap: number | null) => void;
  charts?: ReactNode | undefined;
  lens?: Lens | undefined;
}) {
  const { i18n } = useLingui();
  const count = stone.laps.length;
  const every = lapEvery(stone.laps);
  const distance = every === null ? null : formatDistance(every, i18n.locale);
  // One lap is the whole stone: a profile of it would be one flat block.
  const profile = count > 1;

  return (
    <StoneSection
      id="laps"
      title={<Trans>Laps</Trans>}
      note={
        count === 0 ? null : distance === null ? (
          <Plural value={count} one="# lap" other="# laps" />
        ) : (
          <Trans>
            <Plural value={count} one="# lap" other="# laps" /> · a lap every {distance}
          </Trans>
        )
      }
    >
      {count === 0 ? (
        <p className="text-muted-foreground">
          <Trans>The watch recorded no laps: this stone keeps its totals only.</Trans>
        </p>
      ) : (
        <>
          {charts !== undefined && profile ? (
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start lg:gap-10">
              <div className="lg:hidden">
                <LapProfile stone={stone} active={active} onActive={onActive} />
              </div>
              <LapColumn stone={stone} active={active} onActive={onActive} />
              <div className="lg:sticky lg:top-6">{charts}</div>
            </div>
          ) : (
            <>
              {profile && <LapProfile stone={stone} active={active} onActive={onActive} />}
              {charts}
            </>
          )}
          <LapTable stone={stone} active={active} onActive={onActive} lens={lens} />
        </>
      )}
    </StoneSection>
  );
}

/** A row that opens onto its lap: which lap is open, how to open another (or none), and what to draw in it. */
export type Lens = { open: number | null; onOpen: (lap: number | null) => void; draw: (lap: number) => ReactNode };

/** Pointing makes a lap active for a mouse only; a finger's pointer leaves as soon as it lifts, so a tap holds instead. */
const byMouse = (event: PointerEvent) => event.pointerType === 'mouse';

/** Only every nth lap is numbered under the profile when there are many, so the numbers never crowd. */
const numberEvery = (count: number) => (count <= 16 ? 1 : count <= 40 ? 5 : 10);

function LapProfile({
  stone,
  active,
  onActive,
}: {
  stone: Stone;
  active: number | null;
  onActive: (lap: number | null) => void;
}) {
  const bars = lapStrip(stone.laps);
  const dye = dyeFill[dyeOf(stone.sport)];
  const every = numberEvery(bars.length);

  return (
    // Decorative: the table below says the same in words.
    <div aria-hidden className="flex flex-col gap-1 pt-2" onPointerLeave={(e) => byMouse(e) && onActive(null)}>
      <div className="flex h-28 items-end gap-0.5 sm:h-36">
        {bars.map((bar, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: laps are positional and never reorder
            key={i}
            onPointerEnter={(e) => byMouse(e) && onActive(i)}
            // A tap on a block makes its lap active; the keyboard reaches the same lap through its row.
            onPointerUp={(e) => !byMouse(e) && onActive(i)}
            className="flex h-full min-w-0 items-end"
            style={{ flexGrow: bar.width, flexBasis: 0 }}
          >
            <div
              className={cn(
                'w-full rounded-t-xs transition-opacity duration-150',
                dye,
                !bar.hasSpeed && 'opacity-40',
                active !== null && active !== i && 'opacity-30',
              )}
              style={{ height: `${bar.height * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-0.5 text-xs text-muted-foreground tabular-nums">
        {bars.map((bar, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: laps are positional and never reorder
            key={i}
            className={cn('min-w-0 overflow-visible text-center whitespace-nowrap', active === i && 'text-foreground')}
            style={{ flexGrow: bar.width, flexBasis: 0 }}
          >
            {(i + 1) % every === 0 || i === 0 || active === i ? i + 1 : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * The profile stood upright, from 1024px: a row per lap, top to bottom, its bar as long as the lap
 * was fast against the others, in the sport's dye, with its number before and its pace or speed
 * after. Rows share the height beside the charts and never go thinner than a line of small type;
 * with many laps only every few are numbered, and the active one always.
 */
function LapColumn({
  stone,
  active,
  onActive,
}: {
  stone: Stone;
  active: number | null;
  onActive: (lap: number | null) => void;
}) {
  const { i18n } = useLingui();
  const bars = lapStrip(stone.laps);
  const dye = dyeFill[dyeOf(stone.sport)];
  const every = numberEvery(bars.length);
  const paces = stone.laps.map((lap) =>
    paceOrSpeed(stone.sport.sport, lap.distance, lap.movingTime, i18n.locale, { unit: false }),
  );
  const measured = paces.find((pace) => pace !== null) ?? null;
  const roomy = bars.length <= 24;

  return (
    // Decorative, as the profile across is: the table below says the same in words.
    <div aria-hidden className="hidden h-full flex-col gap-1.5 lg:flex">
      <div className="flex items-baseline justify-between gap-4 text-xs text-muted-foreground">
        <span>
          <Trans>Lap</Trans>
        </span>
        {measured !== null && (
          <span>
            {measured.measure === 'pace' ? <Trans>Pace</Trans> : <Trans>Speed</Trans>} {measured.unit}
          </span>
        )}
      </div>
      <div
        className="flex min-h-80 flex-1 flex-col gap-0.5 text-xs tabular-nums"
        onPointerLeave={(e) => byMouse(e) && onActive(null)}
      >
        {bars.map((bar, i) => {
          const named = roomy || (i + 1) % every === 0 || i === 0 || active === i;
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: laps are positional and never reorder
              key={i}
              onPointerEnter={(e) => byMouse(e) && onActive(i)}
              onPointerUp={(e) => !byMouse(e) && onActive(i)}
              className={cn(
                'flex max-h-8 min-h-1.5 flex-1 items-center gap-2 leading-none text-muted-foreground',
                active === i && 'font-semibold text-foreground',
              )}
            >
              <span className="w-6 shrink-0 text-right">{named ? i + 1 : ''}</span>
              <span className="flex h-full min-w-0 flex-1">
                <span
                  className={cn(
                    'h-full rounded-r-xs transition-opacity duration-150',
                    dye,
                    !bar.hasSpeed && 'opacity-40',
                    active !== null && active !== i && 'opacity-30',
                  )}
                  style={{ width: `${bar.height * 100}%` }}
                />
              </span>
              {measured !== null && (
                <span className="w-10 shrink-0 text-right">{named ? (paces[i]?.value ?? '–') : ''}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LapTable({
  stone,
  active,
  onActive,
  lens,
}: {
  stone: Stone;
  active: number | null;
  onActive: (lap: number | null) => void;
  lens: Lens | undefined;
}) {
  const { i18n } = useLingui();
  const withoutUnit = { unit: false };
  const paces = stone.laps.map((lap) =>
    paceOrSpeed(stone.sport.sport, lap.distance, lap.movingTime, i18n.locale, withoutUnit),
  );
  // Every lap shares the stone's sport, so the column is pace or speed throughout, or not there at all.
  const measured = paces.find((pace) => pace !== null) ?? null;
  // The watch's own figures for each lap: a column for each some lap recorded, and its intensity
  // when that tells the laps apart.
  const figures = lapFigures(stone.laps, stone.sport.sport, i18n.locale);
  const intensity = showsIntensity(stone.laps);
  // Units sit in the headers so the cells hold bare values that never wrap. On a phone the cells
  // tighten, and the last column shown (elapsed time is hidden) keeps the panel's inset.
  const cell = 'whitespace-nowrap px-2 py-2.5 first:pl-4 sm:px-4';
  const lastOnPhone = 'max-sm:pr-4';
  const paceLast = figures.length === 0 && lastOnPhone;
  const columns = 4 + (intensity ? 1 : 0) + (measured !== null ? 1 : 0) + figures.length;
  const toggle = (lap: number) => lens?.onOpen(lens.open === lap ? null : lap);
  const onKeyDown = (lap: number) => (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (lens === undefined || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    toggle(lap);
  };
  // A row's handlers and look: pointing or focusing makes its lap active; with a lens, it opens too.
  const rowProps = (i: number) => ({
    // Focusable so the keyboard can make a lap active and see it in the profile and the charts.
    tabIndex: 0,
    'aria-expanded': lens === undefined ? undefined : lens.open === i,
    onFocus: () => onActive(i),
    onBlur: () => onActive(null),
    onPointerEnter: (e: PointerEvent) => byMouse(e) && onActive(i),
    onPointerUp: (e: PointerEvent) => !byMouse(e) && onActive(i),
    onClick: lens === undefined ? undefined : () => toggle(i),
    onKeyDown: onKeyDown(i),
    className: cn(
      'border-t transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-inset',
      lens !== undefined && 'cursor-pointer',
      (active === i || lens?.open === i) && 'bg-accent font-semibold',
    ),
  });

  return (
    // A container, so an open lens is as wide as what shows of the table rather than all of it.
    <div className="@container overflow-x-auto rounded-xs border bg-card">
      <table className="w-full tabular-nums" onPointerLeave={(e) => byMouse(e) && onActive(null)}>
        <thead className="text-left align-bottom text-xs text-muted-foreground">
          {/* Names may wrap on the narrowest phones; the values under them never do. */}
          <tr className="[&>th]:whitespace-normal">
            <th scope="col" className={cn(cell, 'font-medium')}>
              <Trans>Lap</Trans>
            </th>
            {intensity && (
              <th scope="col" className={cn(cell, 'font-medium')}>
                <Trans>Intensity</Trans>
              </th>
            )}
            <th scope="col" className={cn(cell, 'text-right font-medium')}>
              <Trans>Distance</Trans>
              <ColumnUnit>{units.distance}</ColumnUnit>
            </th>
            <th scope="col" className={cn(cell, 'text-right font-medium', measured === null && paceLast)}>
              <Trans>Moving time</Trans>
            </th>
            {measured !== null && (
              <th scope="col" className={cn(cell, 'text-right font-medium', paceLast)}>
                {measured.measure === 'pace' ? <Trans>Pace</Trans> : <Trans>Speed</Trans>}
                <ColumnUnit>{measured.unit}</ColumnUnit>
              </th>
            )}
            {figures.map((column, c) => (
              <th
                key={column.key}
                scope="col"
                className={cn(cell, 'text-right font-medium', c === figures.length - 1 && lastOnPhone)}
              >
                <FigureLabel figure={column.key} />
                <ColumnUnit>{column.unit}</ColumnUnit>
              </th>
            ))}
            <th scope="col" className={cn(cell, 'text-right font-medium max-sm:hidden')}>
              <Trans>Elapsed time</Trans>
            </th>
          </tr>
        </thead>
        <tbody>
          {stone.laps.map((lap, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: laps are positional and never reorder
            <Fragment key={i}>
              <tr {...rowProps(i)}>
                <th scope="row" className={cn(cell, 'text-left', active === i ? 'font-semibold' : 'font-normal')}>
                  <LapNumber lap={i} opens={lens !== undefined} open={lens?.open === i} />
                </th>
                {intensity && (
                  <td className={cell}>{lap.intensity === null ? '–' : <IntensityName intensity={lap.intensity} />}</td>
                )}
                <td className={cn(cell, 'text-right')}>
                  {lap.distance === null ? '–' : formatDistance(lap.distance, i18n.locale, withoutUnit)}
                </td>
                <td className={cn(cell, 'text-right', measured === null && paceLast)}>
                  {formatDuration(lap.movingTime)}
                </td>
                {measured !== null && <td className={cn(cell, 'text-right', paceLast)}>{paces[i]?.value ?? '–'}</td>}
                {figures.map((column, c) => (
                  <td key={column.key} className={cn(cell, 'text-right', c === figures.length - 1 && lastOnPhone)}>
                    {column.values[i] ?? '–'}
                  </td>
                ))}
                <td className={cn(cell, 'text-right max-sm:hidden')}>{formatDuration(lap.elapsedTime)}</td>
              </tr>
              {lens?.open === i && (
                <tr className="bg-background">
                  <td colSpan={columns} className="pt-1 pb-4">
                    {/* Held in view while the table scrolls sideways under it, as wide as the panel. */}
                    <div className="sticky left-0 w-[100cqw] px-4">{lens.draw(i)}</div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A lap's number in its row, after a chevron that turns when the row opens onto its lens. */
function LapNumber({ lap, opens, open }: { lap: number; opens: boolean; open: boolean }) {
  if (!opens) return lap + 1;
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg
        aria-hidden
        viewBox="0 0 10 10"
        className={cn('size-2.5 transition-transform duration-150', open && 'rotate-90')}
      >
        <path d="M3 1.5 7 5 3 8.5" fill="none" stroke="currentColor" strokeWidth={1.5} />
      </svg>
      {lap + 1}
    </span>
  );
}

/** What part of the stone a lap was, as the watch marked it. */
function IntensityName({ intensity }: { intensity: NonNullable<Stone['laps'][number]['intensity']> }): ReactNode {
  switch (intensity) {
    case 'warm-up':
      return <Trans>Warm-up</Trans>;
    case 'active':
      return <Trans>Active</Trans>;
    case 'recovery':
      return <Trans>Recovery</Trans>;
    case 'rest':
      return <Trans>Rest</Trans>;
    case 'cool-down':
      return <Trans>Cool-down</Trans>;
  }
}
