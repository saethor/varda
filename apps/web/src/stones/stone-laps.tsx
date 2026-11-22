import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { formatDistance, formatDuration, units } from '@varda/ui/lib/format';
import { cn } from '@varda/ui/lib/utils';
import { type PointerEvent, type ReactNode, useState } from 'react';
import type { Stone } from '../lib/stones.ts';
import { lapFigures, showsIntensity } from './lap-figures.ts';
import { lapEvery, lapStrip } from './lap-strip.ts';
import { paceOrSpeed } from './pace-or-speed.ts';
import { dyeFill, dyeOf } from './sport-dye.ts';
import { FigureLabel } from './stone-figures.tsx';
import { ColumnUnit, StoneSection } from './stone-section.tsx';

/**
 * The stone's laps: a profile across the full width, a block per lap (width by distance, height by
 * speed, in the sport's dye), then the table of their figures. Pointing at a lap in either makes it
 * the one active lap: its block stays full, the others fall back, and its row lights. A mouse points,
 * a finger taps (the lap holds until another is tapped), and the keyboard focuses a row.
 */
export function StoneLaps({ stone }: { stone: Stone }) {
  const { i18n } = useLingui();
  const [active, setActive] = useState<number | null>(null);
  const count = stone.laps.length;
  const every = lapEvery(stone.laps);
  const distance = every === null ? null : formatDistance(every, i18n.locale);

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
          <LapProfile stone={stone} active={active} onActive={setActive} />
          <LapTable stone={stone} active={active} onActive={setActive} />
        </>
      )}
    </StoneSection>
  );
}

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

function LapTable({
  stone,
  active,
  onActive,
}: {
  stone: Stone;
  active: number | null;
  onActive: (lap: number | null) => void;
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

  return (
    <div className="overflow-x-auto rounded-xs border bg-card">
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
            <tr
              // biome-ignore lint/suspicious/noArrayIndexKey: laps are positional and never reorder
              key={i}
              // Focusable so the keyboard can make a lap active and see it in the profile above.
              tabIndex={0}
              onFocus={() => onActive(i)}
              onBlur={() => onActive(null)}
              onPointerEnter={(e) => byMouse(e) && onActive(i)}
              onPointerUp={(e) => !byMouse(e) && onActive(i)}
              className={cn(
                'border-t transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-inset',
                active === i && 'bg-accent font-semibold',
              )}
            >
              <th scope="row" className={cn(cell, 'text-left', active === i ? 'font-semibold' : 'font-normal')}>
                {i + 1}
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
          ))}
        </tbody>
      </table>
    </div>
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
