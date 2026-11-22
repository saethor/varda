import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { cn } from '@varda/ui/lib/utils';
import type { Stone } from '../lib/stones.ts';
import { type LocalDate, midnightOf } from './local-date.ts';
import type { StitchRow } from './route-weeks.ts';
import { dyeFill, dyeOf } from './sport-dye.ts';
import { SportName } from './stone-card.tsx';

/**
 * The last weeks knitted as rows, a stitch a day, dyed by the sport of each stone that day: whether
 * the habit holds shows as a pattern. A day with two stones carries both yarns.
 */
export function StitchWeeks({
  rows,
  today,
  activeId,
  className,
}: {
  rows: StitchRow<Stone>[];
  today: LocalDate;
  /** The stone pointed at in the route; its stitch is picked out. */
  activeId: string | null;
  className?: string;
}) {
  const { i18n } = useLingui();
  const first = rows[0];
  if (!first) return null;

  return (
    <section
      aria-labelledby="last-weeks"
      className={cn('flex flex-col gap-3 rounded-xs border bg-card p-5', className)}
    >
      <h2 id="last-weeks" className="font-semibold">
        <Plural value={rows.length} one="Last week" other="Last # weeks" />
      </h2>
      <table className="w-full table-fixed border-separate border-spacing-x-0.5 border-spacing-y-1 text-xs tabular-nums">
        <thead>
          <tr className="text-muted-foreground">
            <th scope="col" className="w-14">
              <span className="sr-only">
                <Trans>Week of</Trans>
              </span>
            </th>
            {first.days.map(({ date }) => (
              <th key={date} scope="col" className="font-normal">
                <abbr
                  title={i18n.date(midnightOf(date), { weekday: 'long', timeZone: 'UTC' })}
                  className="no-underline"
                >
                  {i18n.date(midnightOf(date), { weekday: 'narrow', timeZone: 'UTC' })}
                </abbr>
              </th>
            ))}
            <th scope="col" className="w-12 text-right font-normal">
              <Trans>Stones</Trans>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.monday}>
              <th scope="row" className="w-14 pr-1 text-left font-normal whitespace-nowrap text-muted-foreground">
                {i18n.date(midnightOf(row.monday), { day: 'numeric', month: 'short', timeZone: 'UTC' })}
              </th>
              {row.days.map((day) => (
                <td key={day.date} className="p-0">
                  <Stitch day={day} today={today} activeId={activeId} />
                </td>
              ))}
              <td className={cn('w-8 text-right', row.stones === 0 && 'text-muted-foreground')}>{row.stones}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Stitch({
  day,
  today,
  activeId,
}: {
  day: StitchRow<Stone>['days'][number];
  today: LocalDate;
  activeId: string | null;
}) {
  const active = day.stones.some((s) => s.id === activeId);
  return (
    <div
      className={cn(
        'flex h-3 gap-px overflow-hidden rounded-xs transition-shadow',
        day.stones.length === 0 && !day.ahead && 'bg-foreground/10',
        day.ahead && 'bg-foreground/[0.04]',
        day.date === today && 'outline outline-1 outline-offset-1 outline-foreground',
        active && 'outline-2 outline-offset-1 outline-foreground',
      )}
    >
      {day.stones.map((stone) => (
        <span key={stone.id} className={cn('flex-1', dyeFill[dyeOf(stone.sport)])} />
      ))}
      <span className="sr-only">
        {day.stones.length === 0
          ? '–'
          : day.stones.map((stone, i) => (
              <span key={stone.id}>
                {i > 0 && ', '}
                <SportName sport={stone.sport.sport} />
              </span>
            ))}
      </span>
    </div>
  );
}
