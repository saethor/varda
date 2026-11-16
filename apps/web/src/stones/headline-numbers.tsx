import { Trans, useLingui } from '@lingui/react/macro';
import { formatDistance, formatDuration } from '@varda/ui/lib/format';
import { cn } from '@varda/ui/lib/utils';
import type { ReactNode } from 'react';
import type { Stone } from '../lib/stones.ts';
import { paceOrSpeed } from './pace-or-speed.ts';

/**
 * A stone's headline numbers: distance (when it has one), moving time, pace or speed, and elapsed
 * time. Smaller on a card, larger on the stone's own screen.
 */
export function HeadlineNumbers({
  stone,
  size,
  className,
}: {
  stone: Stone;
  size: 'card' | 'screen';
  className?: string;
}) {
  const { i18n } = useLingui();
  const pace = paceOrSpeed(stone.sport.sport, stone.distance, stone.movingTime, i18n.locale);
  const valueClassName = size === 'card' ? 'text-xl' : 'text-3xl';
  const stat = (label: ReactNode, value: string) => (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={valueClassName}>{value}</dd>
    </div>
  );

  return (
    <dl className={cn('grid grid-cols-2 tabular-nums', className)}>
      {stone.distance !== null && stat(<Trans>Distance</Trans>, formatDistance(stone.distance, i18n.locale))}
      {stat(<Trans>Moving time</Trans>, formatDuration(stone.movingTime))}
      {pace && stat(pace.measure === 'pace' ? <Trans>Pace</Trans> : <Trans>Speed</Trans>, pace.value)}
      {stat(<Trans>Elapsed time</Trans>, formatDuration(stone.elapsedTime))}
    </dl>
  );
}
