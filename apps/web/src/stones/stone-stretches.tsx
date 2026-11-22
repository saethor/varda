import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { formatDistance, formatDuration, units } from '@varda/ui/lib/format';
import { cn } from '@varda/ui/lib/utils';
import { useState } from 'react';
import type { StoneDetail } from '../lib/stones.ts';
import { dyeFill, dyeOf } from './sport-dye.ts';
import { ColumnUnit, StoneSection, tableCell } from './stone-section.tsx';

type Stretches = NonNullable<StoneDetail['stretches']>;
type StretchKind = Stretches['inOrder'][number]['kind'];

const kinds: StretchKind[] = ['running', 'walking', 'standing'];

/**
 * A run's stretches: the watch's totals for running, walking and standing, then each stretch in
 * order. Nothing at all for a stone without stretches.
 */
export function StoneStretches({ stone }: { stone: StoneDetail }) {
  const { i18n } = useLingui();
  const { stretches } = stone;
  const [active, setActive] = useState<number | null>(null);
  if (stretches === null) return null;
  const count = stretches.inOrder.length;
  const dye = dyeFill[dyeOf(stone.sport)];
  const totals = kinds.flatMap((kind) => {
    const total = stretches.totals[kind];
    return total === null ? [] : [{ kind, ...total }];
  });

  return (
    <StoneSection
      id="stretches"
      title={<Trans>Stretches</Trans>}
      note={<Plural value={count} one="# stretch" other="# stretches" />}
    >
      <StretchRibbon stone={stone} stretches={stretches} active={active} />
      {totals.length > 0 && (
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] gap-x-6 gap-y-4 tabular-nums">
          {totals.map((total) => (
            <div key={total.kind} className="flex flex-col gap-1">
              <dt className="flex items-baseline gap-2 text-xs text-muted-foreground">
                <span
                  aria-hidden
                  className={cn('inline-block h-1 w-4 -translate-y-px rounded-xs', kindFill[total.kind], dye)}
                />
                <KindName kind={total.kind} />
              </dt>
              <dd className="flex flex-col">
                <span className="text-xl font-medium whitespace-nowrap">
                  {total.movingTime === null ? '–' : formatDuration(total.movingTime)}
                </span>
                {total.distance !== null && (
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDistance(total.distance, i18n.locale)}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <div className="overflow-x-auto rounded-xs border bg-card">
        <table className="w-full tabular-nums">
          <thead className="text-left align-bottom text-xs text-muted-foreground">
            <tr className="[&>th]:whitespace-normal">
              <th scope="col" className={cn(tableCell, 'font-medium')}>
                <Trans>Stretch</Trans>
              </th>
              <th scope="col" className={cn(tableCell, 'text-right font-medium')}>
                <Trans>Start</Trans>
              </th>
              <th scope="col" className={cn(tableCell, 'text-right font-medium')}>
                <Trans>Moving time</Trans>
              </th>
              <th scope="col" className={cn(tableCell, 'text-right font-medium')}>
                <Trans>Distance</Trans>
                <ColumnUnit>{units.distance}</ColumnUnit>
              </th>
            </tr>
          </thead>
          <tbody>
            {stretches.inOrder.map((stretch, i) => (
              <tr
                // biome-ignore lint/suspicious/noArrayIndexKey: stretches are positional and never reorder
                key={i}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                className={cn('border-t transition-colors duration-150', active === i && 'bg-accent')}
              >
                <th scope="row" className={cn(tableCell, 'text-left font-normal')}>
                  <span className="flex items-baseline gap-2">
                    <span
                      aria-hidden
                      className={cn('inline-block h-1 w-4 -translate-y-px rounded-xs', kindFill[stretch.kind], dye)}
                    />
                    <KindName kind={stretch.kind} />
                  </span>
                </th>
                <td className={cn(tableCell, 'text-right')}>
                  {formatDuration((stretch.start.getTime() - stone.start.getTime()) / 1000)}
                </td>
                <td className={cn(tableCell, 'text-right')}>
                  {stretch.movingTime === null ? '–' : formatDuration(stretch.movingTime)}
                </td>
                <td className={cn(tableCell, 'text-right')}>
                  {stretch.distance === null ? '–' : formatDistance(stretch.distance, i18n.locale, { unit: false })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StoneSection>
  );
}

/** Running in the sport's dye, walking in a lighter weave of it, standing undyed. */
const kindFill: Record<StretchKind, string> = {
  running: '',
  walking: 'opacity-45',
  standing: 'bg-foreground/20!',
};

/**
 * The stone's stretches as one row of stitches over its elapsed time, start to end: each stretch
 * runs from its start to the next one's, dyed by its kind. The row pointed at in the table stays
 * full while the others fall back. Decorative: the table says the same in words.
 */
function StretchRibbon({
  stone,
  stretches,
  active,
}: {
  stone: StoneDetail;
  stretches: Stretches;
  active: number | null;
}) {
  const dye = dyeFill[dyeOf(stone.sport)];
  const total = stone.elapsedTime;
  if (total <= 0) return null;
  const offsetOf = (start: Date) => Math.min(total, Math.max(0, (start.getTime() - stone.start.getTime()) / 1000));
  const share = (seconds: number) => `${(seconds / total) * 100}%`;

  return (
    <div aria-hidden className="flex flex-col gap-1 pt-1">
      <div className="relative h-4 overflow-hidden rounded-xs bg-foreground/10">
        {stretches.inOrder.map((stretch, i) => {
          const from = offsetOf(stretch.start);
          const next = stretches.inOrder[i + 1];
          const to = next === undefined ? total : offsetOf(next.start);
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: stretches are positional and never reorder
              key={i}
              className={cn(
                'absolute inset-y-0 transition-opacity duration-150',
                dye,
                kindFill[stretch.kind],
                active !== null && active !== i && 'opacity-25',
              )}
              style={{ left: share(from), width: share(Math.max(0, to - from)) }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{formatDuration(0)}</span>
        <span>{formatDuration(total)}</span>
      </div>
    </div>
  );
}

function KindName({ kind }: { kind: StretchKind }) {
  switch (kind) {
    case 'running':
      return <Trans>Running</Trans>;
    case 'walking':
      return <Trans>Walking</Trans>;
    case 'standing':
      return <Trans>Standing</Trans>;
  }
}
