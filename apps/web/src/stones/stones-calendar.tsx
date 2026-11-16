import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Alert, AlertDescription } from '@varda/ui/components/alert';
import { buttonVariants } from '@varda/ui/components/button';
import { formatDistance, formatDuration } from '@varda/ui/lib/format';
import { cn } from '@varda/ui/lib/utils';
import { calendarQuery, type Stone, usePlaceStone } from '../lib/stones.ts';
import { type CalendarWeek, calendarWeeks, type Month, otherMonth } from './calendar-month.ts';
import type { LocalDate } from './feed-window.ts';
import { PlacingPanel } from './placing-panel.tsx';
import { SportName } from './stone-card.tsx';

/** The stones screen's heading, with the switch between the feed and the calendar. */
export function StonesHeading({ view }: { view: 'feed' | 'calendar' }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold">
        <Trans>Stones</Trans>
      </h1>
      <ViewToggle view={view} />
    </div>
  );
}

/** Switches the stones screen between the feed and the calendar, in the URL. */
function ViewToggle({ view }: { view: 'feed' | 'calendar' }) {
  const { t } = useLingui();
  const option = (active: boolean) =>
    cn('rounded-md px-3 py-1.5 text-sm font-medium', active ? 'bg-card shadow-xs' : 'text-muted-foreground');

  return (
    <nav aria-label={t`Show stones as`} className="flex gap-1 rounded-lg bg-muted p-1">
      <Link
        to="/stones"
        search={{}}
        aria-current={view === 'feed' ? 'page' : undefined}
        className={option(view === 'feed')}
      >
        <Trans>Feed</Trans>
      </Link>
      <Link
        to="/stones"
        search={{ view: 'calendar' }}
        aria-current={view === 'calendar' ? 'page' : undefined}
        className={option(view === 'calendar')}
      >
        <Trans>Calendar</Trans>
      </Link>
    </nav>
  );
}

/**
 * The stones of one month in Mon–Sun weeks across the full width, each week with its totals and no
 * trace, under a slim placing bar. On a phone each week becomes a list.
 */
export function StonesCalendar({ month }: { month: Month }) {
  const { data: stones } = useSuspenseQuery(calendarQuery(month));
  const placing = usePlaceStone();
  const weeks = calendarWeeks(month, stones);
  const placedFrom = placing.isSuccess ? placing.variables.file.name : null;

  return (
    <div className="flex flex-col gap-6">
      <PlacingPanel placing={placing} className="lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-6 lg:py-3" />
      {/* Until a stone opens on its own screen, the calendar says where the new one came from. */}
      {placedFrom !== null && (
        <Alert>
          <AlertDescription>
            <Trans>Stone placed from {placedFrom}</Trans>
          </AlertDescription>
        </Alert>
      )}
      <MonthHeader month={month} />
      <WeekdayHeader week={weeks[0]} />
      <div className="flex flex-col gap-6 lg:gap-1.5">
        {weeks.map((week) => (
          <Week key={week.days[0]?.date} week={week} />
        ))}
      </div>
    </div>
  );
}

/** The month on screen, with links to the months before and after it. */
function MonthHeader({ month }: { month: Month }) {
  const { i18n } = useLingui();
  const name = (m: Month) =>
    i18n.date(new Date(`${m}-01T00:00:00Z`), { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const before = otherMonth(month, -1);
  const after = otherMonth(month, 1);
  const step = buttonVariants({ variant: 'outline', size: 'sm' });

  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold">{name(month)}</h2>
      <div className="flex gap-2">
        {/* On a phone only the arrows show; the month names stay as their accessible names. */}
        <Link to="/stones" search={{ view: 'calendar', month: before }} aria-label={name(before)} className={step}>
          <span aria-hidden>←</span> <span className="max-sm:hidden">{name(before)}</span>
        </Link>
        <Link to="/stones" search={{ view: 'calendar', month: after }} aria-label={name(after)} className={step}>
          <span className="max-sm:hidden">{name(after)}</span> <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

const weekGrid = 'grid-cols-[repeat(7,minmax(0,1fr))_8rem] gap-1.5';

function WeekdayHeader({ week }: { week: CalendarWeek<Stone> | undefined }) {
  const { i18n } = useLingui();
  if (!week) return null;

  return (
    <div className={cn('hidden text-xs text-muted-foreground lg:grid', weekGrid)} aria-hidden>
      {week.days.map(({ date }) => (
        <span key={date} className="px-2">
          {i18n.date(utc(date), { weekday: 'short', timeZone: 'UTC' })}
        </span>
      ))}
      <span className="px-2">
        <Trans>Week</Trans>
      </span>
    </div>
  );
}

function Week({ week }: { week: CalendarWeek<Stone> }) {
  const { i18n } = useLingui();
  const short = (date: LocalDate | undefined) =>
    date ? i18n.date(utc(date), { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '';
  const dates = `${short(week.days[0]?.date)} – ${short(week.days[6]?.date)}`;
  const stones = week.days.flatMap((d) => d.stones);

  return (
    <section aria-label={dates}>
      {/* Desktop: the week across the full width, a cell per day and its totals at the end. */}
      <div className={cn('hidden lg:grid', weekGrid)}>
        {week.days.map((day) => (
          <div
            key={day.date}
            className={cn(
              'flex min-h-28 flex-col gap-1 rounded-lg border p-1',
              day.inMonth ? 'bg-card/50' : 'border-dashed text-muted-foreground',
            )}
          >
            <span className="px-1 text-xs tabular-nums">{Number(day.date.slice(8))}</span>
            {day.stones.map((stone) => (
              <CalendarStone key={stone.id} stone={stone} />
            ))}
          </div>
        ))}
        <WeekTotals totals={week.totals} className="justify-center rounded-lg bg-muted p-3" />
      </div>

      {/* Phone: the week as a list. */}
      <div className="flex flex-col gap-2 lg:hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <h3 className="font-semibold">{dates}</h3>
          <WeekTotals totals={week.totals} className="flex-row gap-x-3 text-muted-foreground" />
        </div>
        {stones.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <Trans>No stones this week</Trans>
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {stones.map((stone) => (
              <li key={stone.id}>
                <CalendarStone stone={stone} withDay />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function WeekTotals({ totals, className }: { totals: CalendarWeek<Stone>['totals']; className?: string }) {
  const { i18n } = useLingui();

  return (
    <p className={cn('flex flex-col gap-0.5 text-sm tabular-nums', className)}>
      <span className="text-xs">
        <Plural value={totals.stones} one="# stone" other="# stones" />
      </span>
      {totals.distance !== null && <span className="font-medium">{formatDistance(totals.distance, i18n.locale)}</span>}
      {totals.stones > 0 && <span>{formatDuration(totals.movingTime)}</span>}
    </p>
  );
}

/** A stone in the calendar: its sport and headline number, with no trace. */
function CalendarStone({ stone, withDay = false }: { stone: Stone; withDay?: boolean }) {
  const { i18n } = useLingui();

  // Opens the stone once "Open a stone" (#64) lands: make this a <Link to="/stones/$stoneId">.
  return (
    <div className="flex flex-col rounded-md border bg-card px-2 py-1.5 text-sm">
      <span className="truncate text-xs text-muted-foreground">
        <SportName sport={stone.sport.sport} />
        {withDay && (
          <>
            {' '}
            · {i18n.date(utc(stone.localDate), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}
          </>
        )}
      </span>
      <span className="tabular-nums">
        {stone.distance !== null ? formatDistance(stone.distance, i18n.locale) : formatDuration(stone.movingTime)}
        {stone.distance !== null && (
          <span className="text-xs text-muted-foreground"> · {formatDuration(stone.movingTime)}</span>
        )}
      </span>
    </div>
  );
}

// A local date has no zone: shown as written, never shifted into the browser's.
const utc = (date: LocalDate) => new Date(`${date}T00:00:00Z`);
