import { Trans, useLingui } from '@lingui/react/macro';
import { Link, useNavigate } from '@tanstack/react-router';
import { formatDistance, formatDuration } from '@varda/ui/lib/format';
import { cn } from '@varda/ui/lib/utils';
import { type ReactNode, useEffect } from 'react';
import type { Stone } from '../lib/stones.ts';
import { monthOf } from './calendar-month.ts';
import { type LocalDate, localStartOf, midnightOf } from './local-date.ts';
import { SportName } from './stone-card.tsx';
import { heroOf, type PlaceInWeek, weekAround } from './stone-week.ts';

/**
 * Where the stone's screen ends: the stones just before and after it, so a look back can walk on
 * through the weeks. The arrow keys walk too.
 */
export function WeekWalk({ stone, place, today }: { stone: Stone; place: PlaceInWeek<Stone>; today: LocalDate }) {
  const { t } = useLingui();
  const { previous, next } = place;

  useArrowKeysWalk(previous, next);

  // Nothing after it, and the days loaded run up to today: it's the newest stone there is.
  const latest = next === null && weekAround(stone.localDate).to >= today;

  return (
    <nav aria-label={t`Stones before and after`} className="grid gap-3 sm:grid-cols-2">
      {previous ? (
        <Neighbour stone={previous} direction="previous" />
      ) : (
        <End
          month={monthOf(stone.localDate)}
          className="sm:text-left"
          message={<Trans>No stone in the week before</Trans>}
        />
      )}
      {next ? (
        <Neighbour stone={next} direction="next" />
      ) : latest ? (
        <p className="flex items-center rounded-xs border border-dashed border-input/60 px-4 py-3 text-muted-foreground sm:justify-end">
          <Trans>Your latest stone</Trans>
        </p>
      ) : (
        <End
          month={monthOf(stone.localDate)}
          className="sm:text-right"
          message={<Trans>No stone in the week after</Trans>}
        />
      )}
    </nav>
  );
}

/** A bare ← or →, pressed outside any field or dialog that wants the keys for itself. */
function isPlainArrow(event: KeyboardEvent): boolean {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return false;
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return false;
  const target = event.target as HTMLElement | null;
  return !target?.closest('input, textarea, select, [contenteditable], [role="alertdialog"], [role="dialog"]');
}

/** ← and → open the stones before and after, unless a field or a dialog has the keys. */
function useArrowKeysWalk(previous: Stone | null, next: Stone | null) {
  const navigate = useNavigate();
  useEffect(() => {
    const walk = (event: KeyboardEvent) => {
      if (!isPlainArrow(event)) return;
      const to = event.key === 'ArrowLeft' ? previous : next;
      if (to === null) return;
      event.preventDefault();
      void navigate({ to: '/stones/$stoneId', params: { stoneId: to.id } });
    };
    window.addEventListener('keydown', walk);
    return () => window.removeEventListener('keydown', walk);
  }, [navigate, previous, next]);
}

function Neighbour({ stone, direction }: { stone: Stone; direction: 'previous' | 'next' }) {
  const { i18n } = useLingui();
  const day = i18n.date(midnightOf(stone.localDate), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  const time = i18n.date(localStartOf(stone), { timeStyle: 'short', timeZone: 'UTC' });
  const lead =
    heroOf(stone.sport.group, stone.distance) === 'distance' && stone.distance !== null
      ? formatDistance(stone.distance, i18n.locale)
      : formatDuration(stone.movingTime);
  const isNext = direction === 'next';

  return (
    <Link
      to="/stones/$stoneId"
      params={{ stoneId: stone.id }}
      aria-keyshortcuts={isNext ? 'ArrowRight' : 'ArrowLeft'}
      className={cn(
        'flex flex-col gap-1 rounded-xs border bg-card px-4 py-3 transition-colors hover:border-input focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
        isNext && 'sm:col-start-2 sm:items-end sm:text-right',
      )}
    >
      <span className="text-xs text-muted-foreground">
        {isNext ? (
          <>
            <Trans>Next</Trans> <span aria-hidden>→</span>
          </>
        ) : (
          <>
            <span aria-hidden>←</span> <Trans>Previous</Trans>
          </>
        )}
      </span>
      <span className="font-medium">
        <SportName sport={stone.sport.sport} />
      </span>
      <span className="text-sm text-muted-foreground tabular-nums">
        {day} · {time} · <span className="whitespace-nowrap">{lead}</span>
      </span>
    </Link>
  );
}

function End({ month, message, className }: { month: string; message: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'flex flex-col gap-1 rounded-xs border border-dashed border-input/60 px-4 py-3 text-muted-foreground',
        className,
      )}
    >
      <span>{message}</span>
      <Link
        to="/stones"
        search={{ view: 'calendar', month }}
        className="font-medium text-primary underline underline-offset-4"
      >
        <Trans>See the calendar</Trans>
      </Link>
    </p>
  );
}
