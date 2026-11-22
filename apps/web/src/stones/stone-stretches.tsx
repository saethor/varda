import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { formatDistance, formatDuration, units } from '@varda/ui/lib/format';
import { cn } from '@varda/ui/lib/utils';
import type { StoneDetail } from '../lib/stones.ts';
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
  if (stretches === null) return null;
  const count = stretches.inOrder.length;
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
      {totals.length > 0 && (
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] gap-x-6 gap-y-4 pt-1 tabular-nums">
          {totals.map((total) => (
            <div key={total.kind} className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">
                <KindName kind={total.kind} />
              </dt>
              <dd className="flex flex-col">
                <span className="text-xl whitespace-nowrap">
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
              // biome-ignore lint/suspicious/noArrayIndexKey: stretches are positional and never reorder
              <tr key={i} className="border-t">
                <th scope="row" className={cn(tableCell, 'text-left font-normal')}>
                  <KindName kind={stretch.kind} />
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
