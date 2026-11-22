import { Trans } from '@lingui/react/macro';
import { ORPCError } from '@orpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, notFound, useRouterState } from '@tanstack/react-router';
import { type StoneDetail, stoneQuery, weekAroundQuery } from '../../lib/stones.ts';
import { DeleteStone } from '../../stones/delete-stone.tsx';
import { todayHere } from '../../stones/feed-window.ts';
import { FromTheWatch, StoneEffort } from '../../stones/from-the-watch.tsx';
import { StoneCharts } from '../../stones/stone-charts.tsx';
import { StoneFigures } from '../../stones/stone-figures.tsx';
import { StoneLaps } from '../../stones/stone-laps.tsx';
import { StoneMeasurements } from '../../stones/stone-measurements.tsx';
import { StonePlate } from '../../stones/stone-plate.tsx';
import { StoneSplits } from '../../stones/stone-splits.tsx';
import { StoneStretches } from '../../stones/stone-stretches.tsx';
import { placeInWeek } from '../../stones/stone-week.ts';
import { WeekWalk } from '../../stones/stone-week-view.tsx';
import { WeekRow } from '../../stones/week-row.tsx';

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
 * One stone, read as a reflection rather than a receipt: its week first, a stitch a day, with the
 * stone's own day opening into the plate that holds it; then its laps; at the end the stones either
 * side of it.
 */
function StoneScreen() {
  const { stoneId } = Route.useParams();
  const stone: StoneDetail = useSuspenseQuery(stoneQuery(stoneId)).data;
  const { data: around } = useSuspenseQuery(weekAroundQuery(stone.localDate));
  const justPlaced = useRouterState({ select: (state) => state.location.state.placed === true });
  const today = todayHere(new Date());
  const place = placeInWeek(stone, around);

  return (
    <section className="flex flex-col gap-8">
      <BackToStones />
      {/* The week and the plate are one shape: the stone's day is a tab of the plate. */}
      <div className="flex flex-col">
        <WeekRow stone={stone} stones={around} today={today} justPlaced={justPlaced} />
        <StonePlate stone={stone} place={place} today={today} justPlaced={justPlaced} />
      </div>

      {/* What the stone shows (spec #74), one section per ticket, each its own component that renders nothing without data. */}
      <StoneFigures stone={stone} />
      <StoneCharts stone={stone} />
      <StoneSplits stone={stone} />
      <StoneLaps stone={stone} />
      {/* Stretches (#80) */}
      <StoneStretches stone={stone} />
      {/* Form (#84) */}
      <StoneMeasurements stone={stone} />

      {/* Reserved: planned against actual (the workout this stone fulfilled, its workout outcome) and the journey it moved along go here, between the stone's own record and the walk through the weeks. */}

      <footer className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-y py-2 text-sm">
          <p className="min-w-0 break-all text-muted-foreground">
            <FromTheWatch stone={stone} />
          </p>
          <DeleteStone stone={stone} className="-ml-3 sm:ml-0 sm:-mr-3" />
        </div>
        {/* Effort and device (#77) */}
        <StoneEffort stone={stone} />
        <WeekWalk stone={stone} place={place} today={today} />
      </footer>
    </section>
  );
}
