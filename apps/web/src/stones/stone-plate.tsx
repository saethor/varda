import { SelectOrdinal, Trans, useLingui } from '@lingui/react/macro';
import { formatDistance, formatDuration } from '@varda/ui/lib/format';
import { cn } from '@varda/ui/lib/utils';
import type { ReactNode } from 'react';
import type { Stone } from '../lib/stones.ts';
import { type LocalDate, localStartOf, midnightOf, shiftDate } from './local-date.ts';
import { paceOrSpeed } from './pace-or-speed.ts';
import { SportName } from './stone-card.tsx';
import { heroOf, mondayOf, type PlaceInWeek } from './stone-week.ts';
import { TraceSvg } from './trace-svg.tsx';

/**
 * The stone on the screen's one dark plate: what it was, when, which stone of its week, the number it
 * leads with, the rest of its figures, and its trace. It sits under its day in the week row.
 */
export function StonePlate({
  stone,
  place,
  today,
  justPlaced,
}: {
  stone: Stone;
  place: PlaceInWeek<Stone>;
  today: LocalDate;
  justPlaced: boolean;
}) {
  const { i18n } = useLingui();
  // The year only when it isn't this one.
  const day = i18n.date(midnightOf(stone.localDate), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: stone.localDate.slice(0, 4) === today.slice(0, 4) ? undefined : 'numeric',
    timeZone: 'UTC',
  });
  const time = i18n.date(localStartOf(stone), { timeStyle: 'short', timeZone: 'UTC' });
  const pace = paceOrSpeed(stone.sport.sport, stone.distance, stone.movingTime, i18n.locale);
  const hero = heroOf(stone.sport.group, stone.distance);

  const stats: { key: string; label: ReactNode; value: string }[] = [];
  if (stone.distance !== null)
    stats.push({ key: 'distance', label: <Trans>Distance</Trans>, value: formatDistance(stone.distance, i18n.locale) });
  stats.push({ key: 'movingTime', label: <Trans>Moving time</Trans>, value: formatDuration(stone.movingTime) });
  if (pace)
    stats.push({
      key: 'pace',
      label: pace.measure === 'pace' ? <Trans>Pace</Trans> : <Trans>Speed</Trans>,
      value: pace.value,
    });
  stats.push({ key: 'elapsedTime', label: <Trans>Elapsed time</Trans>, value: formatDuration(stone.elapsedTime) });
  const lead = stats.find((s) => s.key === hero);
  // Monday 0 to Sunday 6: the open tab above. Under an end tab the plate's corner is square, so the two are one shape.
  const weekday = (midnightOf(stone.localDate).getUTCDay() + 6) % 7;
  const rest = stats.filter((s) => s !== lead);

  return (
    <article
      className={cn(
        'grid gap-x-10 gap-y-6 rounded-xs bg-shell p-5 text-shell-foreground tabular-nums sm:p-7',
        weekday === 0 && 'rounded-tl-none',
        weekday === 6 && 'rounded-tr-none',
        stone.trace === null
          ? "[grid-template-areas:'head'_'figures']"
          : "[grid-template-areas:'head'_'trace'_'figures'] lg:min-h-80 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:[grid-template-areas:'head_trace'_'figures_trace']",
      )}
    >
      <header className="flex flex-col gap-1 [grid-area:head]">
        <h1 className="text-2xl font-semibold tracking-tight">
          <SportName sport={stone.sport.sport} />
        </h1>
        <p className="text-shell-muted">
          {day} ·{' '}
          <span className="whitespace-nowrap">
            <Trans>started {time}</Trans>
          </span>
        </p>
        <PlaceLine place={place} today={today} justPlaced={justPlaced} />
      </header>

      <div className="flex flex-col gap-5 self-end [grid-area:figures]">
        {lead && (
          <dl className="flex flex-col gap-1">
            <dt className="text-xs text-shell-muted">{lead.label}</dt>
            <dd className="text-4xl leading-none font-semibold tracking-tight sm:text-5xl">{lead.value}</dd>
          </dl>
        )}
        <dl className="flex flex-wrap gap-x-8 gap-y-4 border-t border-shell-line pt-4">
          {rest.map((stat) => (
            <div key={stat.key} className="flex flex-col gap-1">
              <dt className="text-xs text-shell-muted">{stat.label}</dt>
              <dd className="text-2xl font-semibold tracking-tight whitespace-nowrap sm:text-3xl">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {stone.trace !== null && (
        <TraceSvg
          trace={stone.trace}
          align="center"
          markStart
          weight={3}
          className="h-44 w-full text-lichen [grid-area:trace] sm:h-56 lg:h-full lg:max-h-[22rem]"
        />
      )}
    </article>
  );
}

/**
 * Which stone of its week this is, e.g. "2nd stone this week". Just after placing, it says so:
 * the line is what tells the athlete it worked.
 */
function PlaceLine({ place, today, justPlaced }: { place: PlaceInWeek<Stone>; today: LocalDate; justPlaced: boolean }) {
  const { i18n } = useLingui();
  const n = place.ordinal;
  const thisWeek = mondayOf(today) === place.monday;
  const lastWeek = shiftDate(mondayOf(today), -7) === place.monday;
  const weekOf = i18n.date(midnightOf(place.monday), { day: 'numeric', month: 'short', timeZone: 'UTC' });

  let which: ReactNode;
  if (justPlaced && thisWeek)
    which = (
      <Trans>
        Placed. Your <SelectOrdinal value={n} one="#st" two="#nd" few="#rd" other="#th" /> stone this week
      </Trans>
    );
  else if (justPlaced && lastWeek)
    which = (
      <Trans>
        Placed. Your <SelectOrdinal value={n} one="#st" two="#nd" few="#rd" other="#th" /> stone last week
      </Trans>
    );
  else if (justPlaced)
    which = (
      <Trans>
        Placed. Your <SelectOrdinal value={n} one="#st" two="#nd" few="#rd" other="#th" /> stone in the week of {weekOf}
      </Trans>
    );
  else if (thisWeek)
    which = (
      <Trans>
        <SelectOrdinal value={n} one="#st" two="#nd" few="#rd" other="#th" /> stone this week
      </Trans>
    );
  else if (lastWeek)
    which = (
      <Trans>
        <SelectOrdinal value={n} one="#st" two="#nd" few="#rd" other="#th" /> stone last week
      </Trans>
    );
  else
    which = (
      <Trans>
        <SelectOrdinal value={n} one="#st" two="#nd" few="#rd" other="#th" /> stone in the week of {weekOf}
      </Trans>
    );

  return (
    <p role={justPlaced ? 'status' : undefined} className="text-lichen">
      {which}
    </p>
  );
}
