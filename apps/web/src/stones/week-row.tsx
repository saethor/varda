import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { formatDistance, formatDuration } from '@varda/ui/lib/format';
import { cn } from '@varda/ui/lib/utils';
import type { Stone } from '../lib/stones.ts';
import { type LocalDate, localStartOf, midnightOf, shiftDate } from './local-date.ts';
import { weekRow } from './route-weeks.ts';
import { dyeFill, dyeOf } from './sport-dye.ts';
import { SportName } from './stone-card.tsx';
import { mondayOf } from './stone-week.ts';

/**
 * The stone's week as seven days, a stitch a day dyed by its stones, each stone a way to open it.
 * The stone's own day is a dark tab that opens down into the plate below it. Just after placing,
 * the stone's stitch settles into the row.
 */
export function WeekRow({
  stone,
  stones,
  today,
  justPlaced,
}: {
  stone: Stone;
  /** The stones loaded around it; those outside its week are left out. */
  stones: Stone[];
  today: LocalDate;
  justPlaced: boolean;
}) {
  const { i18n, t } = useLingui();
  const monday = mondayOf(stone.localDate);
  // The stone itself always counts, even if the stones loaded are older than it.
  const week = weekRow([stone, ...stones.filter((s) => s.id !== stone.id)], monday, today);
  const short = (date: LocalDate) => i18n.date(midnightOf(date), { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const thisMonday = mondayOf(today);
  const { totals } = week;

  return (
    <nav aria-label={t`The week of ${short(monday)}`} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 tabular-nums">
        <p className="flex items-baseline gap-2 font-semibold">
          <span>
            {short(monday)} – {short(week.days[6]?.date ?? monday)}
          </span>
          {monday === thisMonday && (
            <span className="text-sm font-normal text-muted-foreground">
              <Trans>This week</Trans>
            </span>
          )}
          {monday === shiftDate(thisMonday, -7) && (
            <span className="text-sm font-normal text-muted-foreground">
              <Trans>Last week</Trans>
            </span>
          )}
        </p>
        <p className="text-sm">
          <Plural value={totals.stones} one="# stone" other="# stones" />
          {totals.distance !== null && <> · {formatDistance(totals.distance, i18n.locale)}</>}
          {' · '}
          {formatDuration(totals.movingTime)}
        </p>
      </div>
      <ol className="grid grid-cols-7 gap-1">
        {week.days.map((day) => {
          const open = day.date === stone.localDate;
          const date = midnightOf(day.date);
          return (
            <li
              key={day.date}
              className={cn(
                'flex min-w-0 flex-col gap-1.5 rounded-t-xs px-1.5 pt-2 pb-3 text-xs tabular-nums sm:px-3',
                open ? 'bg-shell text-shell-muted' : 'text-muted-foreground',
              )}
            >
              <span className="truncate">
                <abbr title={i18n.date(date, { weekday: 'long', timeZone: 'UTC' })} className="no-underline">
                  <span className="sm:hidden">{i18n.date(date, { weekday: 'narrow', timeZone: 'UTC' })}</span>
                  <span className="max-sm:hidden">{i18n.date(date, { weekday: 'short', timeZone: 'UTC' })}</span>
                </abbr>{' '}
                <span className={cn(open && 'text-shell-foreground')}>{date.getUTCDate()}</span>
              </span>
              <span
                className={cn(
                  'flex h-4 gap-px rounded-xs',
                  day.stones.length === 0 && (day.ahead ? 'bg-foreground/[0.04]' : 'bg-foreground/10'),
                  day.date === today && !open && 'outline outline-1 outline-offset-1 outline-foreground',
                )}
              >
                {day.stones.map((s) => (
                  <DayStone
                    key={s.id}
                    stone={s}
                    current={s.id === stone.id}
                    // On the open day the other stones fall back, so the one on screen stands out.
                    receded={open && s.id !== stone.id}
                    settles={justPlaced && s.id === stone.id}
                  />
                ))}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** One stone's share of its day's stitch, in its sport's dye, opening it; the stone on screen is marked, not linked. */
function DayStone({
  stone,
  current,
  receded,
  settles,
}: {
  stone: Stone;
  current: boolean;
  receded: boolean;
  settles: boolean;
}) {
  const { i18n } = useLingui();
  const time = i18n.date(localStartOf(stone), { timeStyle: 'short', timeZone: 'UTC' });
  const dye = dyeFill[dyeOf(stone.sport)];
  const label = (
    <span className="sr-only">
      <SportName sport={stone.sport.sport} />, {time}
    </span>
  );

  if (current)
    return (
      <span aria-current="page" className={cn('flex-1 rounded-xs', dye, settles && 'motion-safe:animate-stone-settle')}>
        {label}
      </span>
    );

  return (
    <Link
      to="/stones/$stoneId"
      params={{ stoneId: stone.id }}
      // The stitch is 16px tall; the link's target reaches into the padding around it.
      className={cn(
        'relative flex-1 rounded-xs transition-opacity before:absolute before:inset-x-0 before:-inset-y-2.5 hover:opacity-75 focus-visible:outline-none',
        // On the dark tab the focus ring is Lichen, as everywhere on Svart.
        receded
          ? 'opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lichen'
          : 'focus-visible:ring-[3px] focus-visible:ring-ring',
        dye,
      )}
    >
      {label}
    </Link>
  );
}
