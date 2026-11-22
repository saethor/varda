import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { formatDistance, formatDuration } from '@varda/ui/lib/format';
import { cn } from '@varda/ui/lib/utils';
import type { Stone } from '../lib/stones.ts';
import { type LocalDate, localStartOf, midnightOf, shiftDate } from './local-date.ts';
import { paceOrSpeed } from './pace-or-speed.ts';
import type { RouteWeek, WeekTotals } from './route-weeks.ts';
import { dyeBorder, dyeFill, dyeOf } from './sport-dye.ts';
import { SportName } from './stone-card.tsx';
import { mondayOf } from './stone-week.ts';
import { TraceSvg } from './trace-svg.tsx';

/**
 * The stones as one route back through the weeks: a line down the left with a station per stone in
 * its sport's yarn, each week crossing the line with its totals. A week with no stones runs the
 * line dashed, so a gap in training shows as a gap in the route.
 */
export function StoneRoute({
  weeks,
  today,
  activeId,
  onActive,
  justPlaced,
}: {
  weeks: RouteWeek<Stone>[];
  today: LocalDate;
  activeId: string | null;
  onActive: (id: string | null) => void;
  /** A stone just placed: its station settles onto the line. */
  justPlaced: string | null;
}) {
  return (
    <div className="flex flex-col">
      {weeks.map((week, i) => (
        <Week
          key={week.monday}
          week={week}
          first={i === 0}
          today={today}
          activeId={activeId}
          onActive={onActive}
          justPlaced={justPlaced}
        />
      ))}
    </div>
  );
}

/** The gutter the line runs down; stations and week ticks centre on it. */
const gutter = 'relative z-10 w-6 shrink-0 self-stretch';

function Week({
  week,
  first,
  today,
  activeId,
  onActive,
  justPlaced,
}: {
  week: RouteWeek<Stone>;
  /** The newest week: the line starts at its tick, the end of the route so far. */
  first: boolean;
  today: LocalDate;
  activeId: string | null;
  onActive: (id: string | null) => void;
  justPlaced: string | null;
}) {
  const { i18n } = useLingui();
  const short = (date: LocalDate) => i18n.date(midnightOf(date), { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const id = `week-${week.monday}`;
  const empty = week.stones.length === 0;
  const thisMonday = mondayOf(today);

  return (
    <section aria-labelledby={id} className="flex">
      <div className={gutter} aria-hidden>
        <span
          className={cn(
            'absolute bottom-0 left-1/2 -translate-x-1/2',
            first ? 'top-7' : 'top-0',
            empty
              ? 'w-1 bg-[radial-gradient(circle,var(--color-input)_1.5px,transparent_2px)] bg-size-[4px_7px] bg-repeat-y opacity-70'
              : 'w-1 bg-foreground',
          )}
        />
        <span className="absolute top-[1.375rem] left-1/2 size-3.5 -translate-x-1/2 rounded-full border-[3px] border-foreground bg-background" />
      </div>
      <div className="min-w-0 flex-1 pl-3">
        <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-foreground pt-5 pb-2">
          <h2 id={id} className="flex items-baseline gap-2 font-semibold tabular-nums">
            <span>
              {short(week.monday)} – {short(week.sunday)}
            </span>
            {week.monday === thisMonday && (
              <span className="text-sm font-normal text-muted-foreground">
                <Trans>This week</Trans>
              </span>
            )}
            {week.monday === shiftDate(thisMonday, -7) && (
              <span className="text-sm font-normal text-muted-foreground">
                <Trans>Last week</Trans>
              </span>
            )}
          </h2>
          <Totals totals={week.totals} />
        </header>
        {empty ? (
          <p className="py-3 text-sm text-muted-foreground">
            <Trans>No stones this week</Trans>
          </p>
        ) : (
          <ol>
            {week.stones.map((stone) => (
              <Station
                key={stone.id}
                stone={stone}
                active={stone.id === activeId}
                settles={stone.id === justPlaced}
                onActive={onActive}
              />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function Totals({ totals }: { totals: WeekTotals }) {
  const { i18n } = useLingui();
  if (totals.stones === 0) return null;
  return (
    <p className="flex gap-x-4 text-sm tabular-nums">
      <span>
        <Plural value={totals.stones} one="# stone" other="# stones" />
      </span>
      {totals.distance !== null && <span className="font-medium">{formatDistance(totals.distance, i18n.locale)}</span>}
      <span>{formatDuration(totals.movingTime)}</span>
    </p>
  );
}

/** One stone on the route. The whole row opens it; pointing at it picks out its stitch. */
function Station({
  stone,
  active,
  settles,
  onActive,
}: {
  stone: Stone;
  active: boolean;
  /** Just placed: the station settles onto the line. */
  settles: boolean;
  onActive: (id: string | null) => void;
}) {
  const { i18n } = useLingui();
  const dye = dyeOf(stone.sport);
  const day = i18n.date(midnightOf(stone.localDate), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  const time = i18n.date(localStartOf(stone), { timeStyle: 'short', timeZone: 'UTC' });
  const pace = paceOrSpeed(stone.sport.sport, stone.distance, stone.movingTime, i18n.locale);
  const distance = stone.distance === null ? null : formatDistance(stone.distance, i18n.locale);
  const movingTime = formatDuration(stone.movingTime);
  const lead = distance ?? movingTime;
  const rest = distance === null ? null : [movingTime, pace?.value].filter(Boolean).join(' · ');

  return (
    <li
      className={cn(
        'relative -ml-9 flex items-center border-b border-border pl-9 transition-colors',
        active && 'bg-card/70',
      )}
      onPointerEnter={() => onActive(stone.id)}
      onPointerLeave={() => onActive(null)}
      onFocus={() => onActive(stone.id)}
      onBlur={() => onActive(null)}
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-1/2 left-0.5 z-20 -mt-2.5 size-5 rounded-full border-4 bg-card transition-colors',
          dyeBorder[dye],
          active && dyeFill[dye],
          settles && 'motion-safe:animate-stone-settle',
        )}
      />
      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 py-3 sm:grid-cols-[minmax(0,1fr)_6rem_5.5rem_6.5rem_3.5rem]">
        <div className="flex min-w-0 flex-col max-sm:row-span-2 sm:flex-row sm:items-baseline sm:gap-3">
          <h3 className="font-medium">
            <Link
              to="/stones/$stoneId"
              params={{ stoneId: stone.id }}
              className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
            >
              <SportName sport={stone.sport.sport} />
            </Link>
          </h3>
          <span className="text-sm text-muted-foreground tabular-nums">
            {day} · {time}
          </span>
        </div>
        {/* Phone: the lead number beside the name, the rest under it. */}
        <span className="text-right font-medium tabular-nums sm:hidden">{lead}</span>
        <span className="col-start-2 text-right text-sm text-muted-foreground tabular-nums sm:hidden">{rest}</span>
        {/* Wider: a column each. */}
        <span className="text-right tabular-nums max-sm:hidden">{distance}</span>
        <span className="text-right tabular-nums max-sm:hidden">{movingTime}</span>
        <span className="text-right text-muted-foreground tabular-nums max-sm:hidden">{pace?.value}</span>
        <span className="flex justify-end max-sm:hidden" aria-hidden>
          {stone.trace !== null && (
            <TraceSvg trace={stone.trace} align="center" className="h-7 w-12 text-foreground/70" />
          )}
        </span>
      </div>
    </li>
  );
}
