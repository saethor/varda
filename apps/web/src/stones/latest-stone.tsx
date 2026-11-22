import { SelectOrdinal, Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { formatDistance, formatDuration } from '@varda/ui/lib/format';
import { cn } from '@varda/ui/lib/utils';
import type { ReactNode } from 'react';
import type { Stone } from '../lib/stones.ts';
import { type LocalDate, localStartOf, midnightOf } from './local-date.ts';
import { paceOrSpeed } from './pace-or-speed.ts';
import { SportName } from './stone-card.tsx';
import { heroOf, mondayOf, placeInWeek } from './stone-week.ts';
import { TraceSvg } from './trace-svg.tsx';

/**
 * The newest stone, on the one dark plate of the screen: what it was, when, which stone of its
 * week, and its numbers. The whole plate opens the stone.
 */
export function LatestStone({
  stone,
  stones,
  today,
  className,
}: {
  stone: Stone;
  stones: Stone[];
  today: LocalDate;
  className?: string;
}) {
  const { i18n } = useLingui();
  const place = placeInWeek(stone, stones);
  const n = place.ordinal;
  const day = i18n.date(midnightOf(stone.localDate), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  const time = i18n.date(localStartOf(stone), { timeStyle: 'short', timeZone: 'UTC' });
  const weekOf = i18n.date(midnightOf(place.monday), { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const pace = paceOrSpeed(stone.sport.sport, stone.distance, stone.movingTime, i18n.locale);
  const leadsWithDistance = heroOf(stone.sport.group, stone.distance) === 'distance' && stone.distance !== null;

  const stats: { label: ReactNode; value: string }[] = [];
  if (leadsWithDistance && stone.distance !== null)
    stats.push({ label: <Trans>Distance</Trans>, value: formatDistance(stone.distance, i18n.locale) });
  stats.push({ label: <Trans>Moving time</Trans>, value: formatDuration(stone.movingTime) });
  if (!leadsWithDistance && stone.distance !== null)
    stats.push({ label: <Trans>Distance</Trans>, value: formatDistance(stone.distance, i18n.locale) });
  if (pace)
    stats.push({ label: pace.measure === 'pace' ? <Trans>Pace</Trans> : <Trans>Speed</Trans>, value: pace.value });

  return (
    <article
      className={cn('relative flex min-h-56 gap-6 rounded-xs bg-shell p-5 text-shell-foreground sm:p-7', className)}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {/* The whole plate is the link's target; its name is the sport alone. */}
            <Link
              to="/stones/$stoneId"
              params={{ stoneId: stone.id }}
              className="after:absolute after:inset-0 after:rounded-xs focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-lichen"
            >
              <SportName sport={stone.sport.sport} />
            </Link>
          </h2>
          <p className="text-shell-muted tabular-nums">
            {day} · {time} ·{' '}
            <span className="text-lichen">
              {mondayOf(today) === place.monday ? (
                <Trans>
                  <SelectOrdinal value={n} one="#st" two="#nd" few="#rd" other="#th" /> stone this week
                </Trans>
              ) : (
                <Trans>
                  <SelectOrdinal value={n} one="#st" two="#nd" few="#rd" other="#th" /> stone in the week of {weekOf}
                </Trans>
              )}
            </span>
          </p>
        </div>
        <dl className="flex flex-wrap gap-x-10 gap-y-4 tabular-nums">
          {stats.map(({ label, value }, i) => (
            <div key={value + String(i)} className="flex flex-col gap-1">
              <dt className="text-xs text-shell-muted">{label}</dt>
              <dd
                className={cn(
                  'font-semibold tracking-tight',
                  i === 0 ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl',
                )}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {stone.trace !== null && (
        <TraceSvg
          trace={stone.trace}
          align="center"
          className="size-16 shrink-0 self-start text-lichen sm:h-40 sm:w-44 sm:self-center"
        />
      )}
    </article>
  );
}
