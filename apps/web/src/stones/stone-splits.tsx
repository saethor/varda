import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { formatDistance, formatDuration, formatElevation, formatHeartRate, units } from '@varda/ui/lib/format';
import { cn } from '@varda/ui/lib/utils';
import type { StoneDetail } from '../lib/stones.ts';
import { lapStrip } from './lap-strip.ts';
import { paceOrSpeed } from './pace-or-speed.ts';
import { dyeFill, dyeOf } from './sport-dye.ts';
import { ColumnUnit, StoneSection, tableCell } from './stone-section.tsx';

/**
 * The stone's kilometre splits: each whole kilometre, then the remainder, with its moving time, its
 * pace or speed as the sport talks about it, and its heart rate, ascent and descent when the watch
 * recorded them (a column none of the splits has is left out). Nothing at all without splits.
 */
export function StoneSplits({ stone }: { stone: StoneDetail }) {
  const { i18n } = useLingui();
  const { splits } = stone;
  if (splits.length === 0) return null;
  const withoutUnit = { unit: false };
  const paces = splits.map((split) =>
    paceOrSpeed(stone.sport.sport, split.distance, split.movingTime, i18n.locale, withoutUnit),
  );
  const measured = paces.find((pace) => pace !== null) ?? null;
  const heartRate = splits.some((split) => split.averageHeartRate !== null);
  const climb = splits.some((split) => split.ascent !== null || split.descent !== null);
  // How fast each split went against the others, scaled as the lap profile is; drawn as a bar in the sport's dye.
  const bars = lapStrip(splits.map(({ distance, movingTime }) => ({ distance, movingTime, elapsedTime: movingTime })));
  const dye = dyeFill[dyeOf(stone.sport)];
  const barCell = cn(tableCell, 'w-2/5 max-sm:hidden');
  const head = cn(tableCell, 'text-right font-medium');
  const value = cn(tableCell, 'text-right');
  const orDash = (metres: number | null, format: (value: number) => string) => (metres === null ? '–' : format(metres));

  return (
    <StoneSection
      id="splits"
      title={<Trans>Splits</Trans>}
      note={<Plural value={splits.length} one="# split" other="# splits" />}
    >
      <div className="overflow-x-auto rounded-xs border bg-card">
        <table className="w-full tabular-nums">
          <thead className="text-left align-bottom text-xs text-muted-foreground">
            {/* Names may wrap on the narrowest phones; the values under them never do. */}
            <tr className="[&>th]:whitespace-normal">
              <th scope="col" className={cn(tableCell, 'font-medium')}>
                <Trans>Kilometre</Trans>
              </th>
              <td aria-hidden className={barCell} />
              <th scope="col" className={head}>
                <Trans>Moving time</Trans>
              </th>
              {measured !== null && (
                <th scope="col" className={head}>
                  {measured.measure === 'pace' ? <Trans>Pace</Trans> : <Trans>Speed</Trans>}
                  <ColumnUnit>{measured.unit}</ColumnUnit>
                </th>
              )}
              {heartRate && (
                <th scope="col" className={head}>
                  <Trans>Heart rate</Trans>
                  <ColumnUnit>{units.heartRate}</ColumnUnit>
                </th>
              )}
              {climb && (
                <>
                  <th scope="col" className={head}>
                    <Trans>Ascent</Trans>
                    <ColumnUnit>{units.elevation}</ColumnUnit>
                  </th>
                  <th scope="col" className={head}>
                    <Trans>Descent</Trans>
                    <ColumnUnit>{units.elevation}</ColumnUnit>
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {splits.map((split, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: splits are positional and never reorder
              <tr key={i} className="border-t">
                <th scope="row" className={cn(tableCell, 'text-left font-normal')}>
                  {/* A whole kilometre by its number; the remainder by how far it went, in km. */}
                  {split.kind === 'kilometre' ? i + 1 : formatDistance(split.distance, i18n.locale)}
                </th>
                <td aria-hidden className={barCell}>
                  <div
                    className={cn('h-2.5 rounded-xs', dye, bars[i]?.hasSpeed === false && 'opacity-40')}
                    style={{ width: `${(bars[i]?.height ?? 0) * 100}%` }}
                  />
                </td>
                <td className={value}>{formatDuration(split.movingTime)}</td>
                {measured !== null && <td className={value}>{paces[i]?.value ?? '–'}</td>}
                {heartRate && (
                  <td className={value}>
                    {orDash(split.averageHeartRate, (bpm) => formatHeartRate(bpm, i18n.locale, withoutUnit))}
                  </td>
                )}
                {climb && (
                  <>
                    <td className={value}>
                      {orDash(split.ascent, (m) => formatElevation(m, i18n.locale, withoutUnit))}
                    </td>
                    <td className={value}>
                      {orDash(split.descent, (m) => formatElevation(m, i18n.locale, withoutUnit))}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StoneSection>
  );
}
