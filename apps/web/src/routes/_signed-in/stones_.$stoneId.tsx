import { Trans, useLingui } from '@lingui/react/macro';
import { ORPCError } from '@orpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, notFound, useRouterState } from '@tanstack/react-router';
import { Alert, AlertDescription } from '@varda/ui/components/alert';
import { formatDistance, formatDuration } from '@varda/ui/lib/format';
import type { ReactNode } from 'react';
import { type Stone, stoneQuery } from '../../lib/stones.ts';
import { LapBars } from '../../stones/lap-bars.tsx';
import { paceOrSpeed } from '../../stones/pace-or-speed.ts';
import { SportName } from '../../stones/stone-card.tsx';
import { TraceSvg } from '../../stones/trace-svg.tsx';

declare module '@tanstack/react-router' {
  interface HistoryState {
    /** Set when placing a stone opens it, so its screen says it was just placed. */
    placed?: boolean;
  }
}

export const Route = createFileRoute('/_signed-in/stones_/$stoneId')({
  loader: async ({ context, params: { stoneId } }) => {
    try {
      await context.queryClient.ensureQueryData(stoneQuery(stoneId));
    } catch (error) {
      // A stone that doesn't exist, one that isn't yours, or a mangled link: all "not found".
      if (error instanceof ORPCError && (error.code === 'NOT_FOUND' || error.code === 'BAD_REQUEST')) throw notFound();
      throw error;
    }
  },
  staticData: { layout: 'wide' },
  component: StoneScreen,
  notFoundComponent: NoSuchStone,
});

function BackToStones() {
  return (
    <Link to="/stones" className="self-start text-sm text-muted-foreground hover:text-foreground">
      <span aria-hidden>←</span> <Trans>Stones</Trans>
    </Link>
  );
}

function NoSuchStone() {
  return (
    <section className="flex flex-col gap-4">
      <BackToStones />
      <h1 className="text-2xl font-semibold">
        <Trans>Stone not found</Trans>
      </h1>
      <p className="text-muted-foreground">
        <Trans>There's no such stone. It may have been deleted, or the link may be wrong.</Trans>
      </p>
    </section>
  );
}

/** One stone: its headline numbers, its laps as bars beside a table, its trace and the file it was placed from. */
function StoneScreen() {
  const { stoneId } = Route.useParams();
  const { data: stone } = useSuspenseQuery(stoneQuery(stoneId));
  const justPlaced = useRouterState({ select: (state) => state.location.state.placed === true });
  const { i18n } = useLingui();
  // A local date has no zone: shown as written, never shifted into the browser's.
  const day = i18n.date(new Date(`${stone.localDate}T00:00:00Z`), { dateStyle: 'full', timeZone: 'UTC' });
  const time = i18n.date(stone.start, { timeStyle: 'short' });
  const pace = paceOrSpeed(stone.sport.sport, stone.distance, stone.movingTime, i18n.locale);
  const fileName = stone.fileName;

  return (
    <section className="flex flex-col gap-6">
      <BackToStones />
      {justPlaced && (
        <Alert>
          <AlertDescription>
            <Trans>Stone placed from {fileName}</Trans>
          </AlertDescription>
        </Alert>
      )}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold">
            <SportName sport={stone.sport.sport} />
          </h1>
          <p className="text-muted-foreground">
            <Trans>
              {day} · started {time}
            </Trans>
          </p>
        </div>
        {stone.trace !== null && <TraceSvg trace={stone.trace} className="h-24 w-40 shrink-0 text-primary" />}
      </div>

      <dl className="grid grid-cols-2 gap-6 rounded-xl border bg-card p-6 tabular-nums md:grid-cols-4">
        {stone.distance !== null && (
          <Headline label={<Trans>Distance</Trans>} value={formatDistance(stone.distance, i18n.locale)} />
        )}
        <Headline label={<Trans>Moving time</Trans>} value={formatDuration(stone.movingTime)} />
        {pace && (
          <Headline label={pace.measure === 'pace' ? <Trans>Pace</Trans> : <Trans>Speed</Trans>} value={pace.value} />
        )}
        <Headline label={<Trans>Elapsed time</Trans>} value={formatDuration(stone.elapsedTime)} />
      </dl>

      <section aria-labelledby="laps" className="flex flex-col gap-3">
        <h2 id="laps" className="text-lg font-semibold">
          <Trans>Laps</Trans>
        </h2>
        {stone.laps.length === 0 ? (
          <p className="text-muted-foreground">
            <Trans>The watch recorded no laps: this stone keeps its totals only.</Trans>
          </p>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <LapBars laps={stone.laps} className="h-40 rounded-xl border bg-card p-4" />
            <LapTable stone={stone} />
          </div>
        )}
      </section>

      <p className="border-t pt-6 text-muted-foreground">
        <Trans>Placed from {fileName}</Trans>
      </p>
    </section>
  );
}

function Headline({ label, value }: { label: ReactNode; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-3xl">{value}</dd>
    </div>
  );
}

function LapTable({ stone }: { stone: Stone }) {
  const { i18n } = useLingui();
  const paces = stone.laps.map((lap) => paceOrSpeed(stone.sport.sport, lap.distance, lap.movingTime, i18n.locale));
  // Every lap shares the stone's sport, so the column is pace or speed throughout, or not there at all.
  const measure = paces.find((pace) => pace !== null)?.measure ?? null;

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full tabular-nums">
        <thead className="text-left text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              <Trans>Lap</Trans>
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              <Trans>Distance</Trans>
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              <Trans>Moving time</Trans>
            </th>
            {measure !== null && (
              <th scope="col" className="px-4 py-3 text-right font-medium">
                {measure === 'pace' ? <Trans>Pace</Trans> : <Trans>Speed</Trans>}
              </th>
            )}
            <th scope="col" className="px-4 py-3 text-right font-medium max-sm:hidden">
              <Trans>Elapsed time</Trans>
            </th>
          </tr>
        </thead>
        <tbody>
          {stone.laps.map((lap, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: laps are positional and never reorder
            <tr key={i} className="border-t">
              <th scope="row" className="px-4 py-3 text-left font-normal">
                {i + 1}
              </th>
              <td className="px-4 py-3 text-right">
                {lap.distance === null ? '–' : formatDistance(lap.distance, i18n.locale)}
              </td>
              <td className="px-4 py-3 text-right">{formatDuration(lap.movingTime)}</td>
              {measure !== null && <td className="px-4 py-3 text-right">{paces[i]?.value ?? '–'}</td>}
              <td className="px-4 py-3 text-right max-sm:hidden">{formatDuration(lap.elapsedTime)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
