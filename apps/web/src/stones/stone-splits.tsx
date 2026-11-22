import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { formatDistance, formatDuration, formatElevation, formatHeartRate } from '@varda/ui/lib/format';
import { cn } from '@varda/ui/lib/utils';
import type { StoneDetail } from '../lib/stones.ts';
import { paceOrSpeed } from './pace-or-speed.ts';

/**
 * The stone's kilometre splits: each whole kilometre, then the remainder, with its moving time, its
 * pace or speed as the sport talks about it, and its heart rate, ascent and descent when the watch
 * recorded them (a column none of the splits has is left out). Nothing at all without splits.
 */
export function StoneSplits({ stone }: { stone: StoneDetail }) {
  const { i18n } = useLingui();
  const { splits } = stone;
  if (splits.length === 0) return null;
  const bare = { unit: false };
  const paces = splits.map((split) =>
    paceOrSpeed(stone.sport.sport, split.distance, split.movingTime, i18n.locale, bare),
  );
  const measured = paces.find((pace) => pace !== null) ?? null;
  const heartRate = splits.some((split) => split.averageHeartRate !== null);
  const climb = splits.some((split) => split.ascent !== null || split.descent !== null);
  const cell = 'whitespace-nowrap px-2 py-2.5 first:pl-4 last:pr-4 sm:px-4';
  const head = cn(cell, 'text-right font-medium');
  const value = cn(cell, 'text-right');
  const orDash = (metres: number | null, format: (value: number) => string) => (metres === null ? '–' : format(metres));

  return (
    <section aria-labelledby="splits" className="flex flex-col gap-3">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-foreground pb-2">
        <h2 id="splits" className="text-lg font-semibold">
          <Trans>Splits</Trans>
        </h2>
        <p className="text-sm text-muted-foreground tabular-nums">
          <Plural value={splits.length} one="# split" other="# splits" />
        </p>
      </header>
      <div className="overflow-x-auto rounded-xs border bg-card">
        <table className="w-full tabular-nums">
          <thead className="text-left align-bottom text-xs text-muted-foreground">
            {/* Names may wrap on the narrowest phones; the values under them never do. */}
            <tr className="[&>th]:whitespace-normal">
              <th scope="col" className={cn(cell, 'font-medium')}>
                <Trans>Kilometre</Trans>
              </th>
              <th scope="col" className={head}>
                <Trans>Moving time</Trans>
              </th>
              {measured !== null && (
                <th scope="col" className={head}>
                  {measured.measure === 'pace' ? <Trans>Pace</Trans> : <Trans>Speed</Trans>}
                  <Unit>{measured.unit}</Unit>
                </th>
              )}
              {heartRate && (
                <th scope="col" className={head}>
                  <Trans>Heart rate</Trans>
                  <Unit>bpm</Unit>
                </th>
              )}
              {climb && (
                <>
                  <th scope="col" className={head}>
                    <Trans>Ascent</Trans>
                    <Unit>m</Unit>
                  </th>
                  <th scope="col" className={head}>
                    <Trans>Descent</Trans>
                    <Unit>m</Unit>
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {splits.map((split, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: splits are positional and never reorder
              <tr key={i} className="border-t">
                <th scope="row" className={cn(cell, 'text-left font-normal')}>
                  {/* A whole kilometre by its number; the remainder by how far it went, in km. */}
                  {split.kind === 'kilometre' ? i + 1 : formatDistance(split.distance, i18n.locale)}
                </th>
                <td className={value}>{formatDuration(split.movingTime)}</td>
                {measured !== null && <td className={value}>{paces[i]?.value ?? '–'}</td>}
                {heartRate && (
                  <td className={value}>
                    {orDash(split.averageHeartRate, (bpm) => formatHeartRate(bpm, i18n.locale, bare))}
                  </td>
                )}
                {climb && (
                  <>
                    <td className={value}>{orDash(split.ascent, (m) => formatElevation(m, i18n.locale, bare))}</td>
                    <td className={value}>{orDash(split.descent, (m) => formatElevation(m, i18n.locale, bare))}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** A column's unit, under its name, so the cells below can hold bare values. */
function Unit({ children }: { children: string }) {
  return <span className="block font-normal">{children}</span>;
}
