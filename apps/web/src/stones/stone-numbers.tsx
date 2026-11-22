import { Trans, useLingui } from '@lingui/react/macro';
import { formatDistance, formatDuration } from '@varda/ui/lib/format';
import { cn } from '@varda/ui/lib/utils';
import type { ReactNode } from 'react';
import type { Stone } from '../lib/stones.ts';
import { paceOrSpeed } from './pace-or-speed.ts';
import { heroOf } from './stone-week.ts';

/**
 * A stone's numbers on its own screen: the one it leads with (distance for a run, time for strength),
 * then the rest in a quieter row that fits however few there are.
 */
export function StoneNumbers({ stone, className }: { stone: Stone; className?: string }) {
  const { i18n } = useLingui();
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
  const rest = stats.filter((s) => s !== lead);

  return (
    <div className={cn('flex flex-col gap-6 tabular-nums', className)}>
      {lead && (
        <dl className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">{lead.label}</dt>
          <dd className="text-5xl font-semibold leading-none tracking-tight sm:text-6xl">{lead.value}</dd>
        </dl>
      )}
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] gap-x-6 gap-y-4 border-t pt-4">
        {rest.map((stat) => (
          <div key={stat.key} className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            <dd className="text-xl whitespace-nowrap">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
