import { Trans, useLingui } from '@lingui/react/macro';
import { ORPCError } from '@orpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, notFound, useRouterState } from '@tanstack/react-router';
import { formatDistance, formatDuration } from '@varda/ui/lib/format';
import { cn } from '@varda/ui/lib/utils';
import { type Stone, stoneQuery, weekAroundQuery } from '../../lib/stones.ts';
import { DeleteStone } from '../../stones/delete-stone.tsx';
import { todayHere } from '../../stones/feed-window.ts';
import { LapBars } from '../../stones/lap-bars.tsx';
import { localStartOf, midnightOf } from '../../stones/local-date.ts';
import { paceOrSpeed } from '../../stones/pace-or-speed.ts';
import { SportName } from '../../stones/stone-card.tsx';
import { StoneNumbers } from '../../stones/stone-numbers.tsx';
import { placeInWeek } from '../../stones/stone-week.ts';
import { PlaceLine, WeekWalk } from '../../stones/stone-week-view.tsx';
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
      const stone = await context.queryClient.ensureQueryData(stoneQuery(stoneId));
      // Its week and the week either side, for its place line and the stones before and after it.
      await context.queryClient.ensureQueryData(weekAroundQuery(stone.localDate));
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
    // A 44px target without moving the link off its line: the padding reaches into the gap around it.
    <Link
      to="/stones"
      className="-my-3 -ml-2 inline-flex min-h-11 items-center gap-1 self-start rounded-md px-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
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

/**
 * One stone, read as a reflection rather than a receipt: where it sits in its week, the number it
 * leads with, its trace and laps, and at the end the stones either side of it.
 */
function StoneScreen() {
  const { stoneId } = Route.useParams();
  const { data: stone } = useSuspenseQuery(stoneQuery(stoneId));
  const { data: around } = useSuspenseQuery(weekAroundQuery(stone.localDate));
  const justPlaced = useRouterState({ select: (state) => state.location.state.placed === true });
  const { i18n } = useLingui();
  const today = todayHere(new Date());
  const place = placeInWeek(stone, around);
  // The day and time where the stone was done, never shifted into the browser's zone.
  const day = i18n.date(midnightOf(stone.localDate), { dateStyle: 'full', timeZone: 'UTC' });
  const time = i18n.date(localStartOf(stone), { timeStyle: 'short', timeZone: 'UTC' });
  const fileName = stone.fileName;

  return (
    <section className="flex flex-col gap-8">
      <BackToStones />
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">
            <SportName sport={stone.sport.sport} />
          </h1>
          <p className="text-muted-foreground">
            <Trans>
              {day} · started {time}
            </Trans>
          </p>
        </div>
        <PlaceLine place={place} today={today} justPlaced={justPlaced} />
      </header>

      <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <StoneNumbers stone={stone} />
        {stone.trace !== null && (
          // On a phone the trace comes first, full width under the title; beside the numbers from lg.
          <TraceSvg
            trace={stone.trace}
            align="center"
            className="order-first h-auto max-h-44 w-full text-primary lg:order-none lg:h-40"
          />
        )}
      </div>

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

      {/* Reserved: planned vs actual (the workout this stone fulfilled) and the journey it moved along go here, between the stone's own record and the walk through the weeks. */}

      <footer className="flex flex-col gap-6 border-t pt-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
          <p className="min-w-0 break-all text-muted-foreground">
            <Trans>From your watch · {fileName}</Trans>
          </p>
          <DeleteStone stone={stone} className="-ml-3 sm:ml-0 sm:-mr-3" />
        </div>
        <WeekWalk stone={stone} place={place} today={today} />
      </footer>
    </section>
  );
}

function LapTable({ stone }: { stone: Stone }) {
  const { i18n } = useLingui();
  const bare = { unit: false };
  const paces = stone.laps.map((lap) =>
    paceOrSpeed(stone.sport.sport, lap.distance, lap.movingTime, i18n.locale, bare),
  );
  // Every lap shares the stone's sport, so the column is pace or speed throughout, or not there at all.
  const measured = paces.find((pace) => pace !== null) ?? null;
  // Units sit in the headers so the cells hold bare values that never wrap. On a phone the cells
  // tighten, and the last column shown (elapsed time is hidden) keeps the card's inset.
  const cell = 'whitespace-nowrap px-2 py-2.5 first:pl-4 sm:px-4 sm:py-3';
  const lastOnPhone = 'max-sm:pr-4';

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full tabular-nums">
        <thead className="text-left align-bottom text-xs text-muted-foreground">
          {/* Names may wrap on the narrowest phones; the values under them never do. */}
          <tr className="[&>th]:whitespace-normal">
            <th scope="col" className={cn(cell, 'font-medium')}>
              <Trans>Lap</Trans>
            </th>
            <th scope="col" className={cn(cell, 'text-right font-medium')}>
              <Trans>Distance</Trans>
              <Unit>km</Unit>
            </th>
            <th scope="col" className={cn(cell, 'text-right font-medium', measured === null && lastOnPhone)}>
              <Trans>Moving time</Trans>
            </th>
            {measured !== null && (
              <th scope="col" className={cn(cell, 'text-right font-medium', lastOnPhone)}>
                {measured.measure === 'pace' ? <Trans>Pace</Trans> : <Trans>Speed</Trans>}
                <Unit>{measured.unit}</Unit>
              </th>
            )}
            <th scope="col" className={cn(cell, 'text-right font-medium max-sm:hidden')}>
              <Trans>Elapsed time</Trans>
            </th>
          </tr>
        </thead>
        <tbody>
          {stone.laps.map((lap, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: laps are positional and never reorder
            <tr key={i} className="border-t">
              <th scope="row" className={cn(cell, 'text-left font-normal')}>
                {i + 1}
              </th>
              <td className={cn(cell, 'text-right')}>
                {lap.distance === null ? '–' : formatDistance(lap.distance, i18n.locale, bare)}
              </td>
              <td className={cn(cell, 'text-right', measured === null && lastOnPhone)}>
                {formatDuration(lap.movingTime)}
              </td>
              {measured !== null && <td className={cn(cell, 'text-right', lastOnPhone)}>{paces[i]?.value ?? '–'}</td>}
              <td className={cn(cell, 'text-right max-sm:hidden')}>{formatDuration(lap.elapsedTime)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A column's unit, under its name, so the cells below can hold bare values. */
function Unit({ children }: { children: string }) {
  return <span className="block font-normal">{children}</span>;
}
