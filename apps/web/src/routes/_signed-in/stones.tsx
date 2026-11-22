import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useRouterState } from '@tanstack/react-router';
import { Alert, AlertDescription } from '@varda/ui/components/alert';
import { Button } from '@varda/ui/components/button';
import { cn } from '@varda/ui/lib/utils';
import { useState } from 'react';
import { calendarQuery, feedQuery, stitchQuery, stitchWeeks, takeJustPlaced, usePlaceStone } from '../../lib/stones.ts';
import { monthOf } from '../../stones/calendar-month.ts';
import { feedWindow, todayHere } from '../../stones/feed-window.ts';
import { LatestStone } from '../../stones/latest-stone.tsx';
import { PlacingPanel } from '../../stones/placing-panel.tsx';
import { routeWeeks, stitchRows } from '../../stones/route-weeks.ts';
import { StitchWeeks } from '../../stones/stitch-weeks.tsx';
import { StoneRoute } from '../../stones/stone-route.tsx';
import { StonesCalendar, StonesHeading } from '../../stones/stones-calendar.tsx';
import { stonesSearch } from '../../stones/stones-view.ts';

declare module '@tanstack/react-router' {
  interface HistoryState {
    /** Set when deleting a stone brings the athlete back here: the file it was placed from. */
    deleted?: string;
  }
}

export const Route = createFileRoute('/_signed-in/stones')({
  // Read once per visit, so every window of the feed counts back from the same day.
  beforeLoad: () => ({ today: todayHere(new Date()) }),
  validateSearch: stonesSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) =>
    deps.view === 'calendar'
      ? await context.queryClient.ensureQueryData(calendarQuery(deps.month ?? monthOf(context.today)))
      : await Promise.all([
          context.queryClient.ensureInfiniteQueryData(feedQuery(context.today)),
          context.queryClient.ensureQueryData(stitchQuery(context.today)),
        ]),
  staticData: { layout: 'wide' },
  component: FeedOrCalendar,
});

function FeedOrCalendar() {
  const { view, month } = Route.useSearch();
  const { today } = Route.useRouteContext();
  if (view !== 'calendar') return <Stones />;

  return (
    <section className="flex flex-col gap-6">
      <StonesHeading view="calendar" />
      <JustDeleted />
      <StonesCalendar month={month ?? monthOf(today)} />
    </section>
  );
}

function Stones() {
  const { today } = Route.useRouteContext();
  const feed = useSuspenseInfiniteQuery(feedQuery(today));
  const { data: lastWeeks } = useSuspenseQuery(stitchQuery(today));
  const placing = usePlaceStone();
  // The stone pointed at in the route, picked out in the stitch rows.
  const [activeId, setActiveId] = useState<string | null>(null);
  // A stone placed since the list was last open settles onto the route, once.
  const [justPlaced] = useState(takeJustPlaced);
  const stones = feed.data.pages.flat();
  const latest = stones[0];
  const oldest = feedWindow(today, feed.data.pages.length - 1).from;

  return (
    <section className="flex flex-col gap-6">
      <StonesHeading view="feed" />
      <JustDeleted />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-8">
        <PlacingPanel
          placing={placing}
          stones={stones}
          className="order-3 lg:order-none lg:col-span-2 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-6 lg:py-3"
        />
        {latest === undefined ? (
          <NoStones className="order-1 lg:order-none lg:col-start-1" />
        ) : (
          <LatestStone stone={latest} stones={stones} today={today} className="order-1 lg:order-none lg:col-start-1" />
        )}
        <StitchWeeks
          rows={stitchRows(lastWeeks, today, stitchWeeks)}
          today={today}
          activeId={activeId}
          className="order-2 lg:sticky lg:top-8 lg:order-none lg:col-start-2 lg:row-span-2"
        />
        <div className="order-4 flex flex-col gap-6 lg:order-none lg:col-start-1">
          <StoneRoute
            weeks={routeWeeks(stones, oldest, today)}
            today={today}
            activeId={activeId}
            onActive={setActiveId}
            justPlaced={justPlaced}
          />
          <Button
            variant="secondary"
            className="self-center"
            disabled={feed.isFetchingNextPage}
            onClick={() => void feed.fetchNextPage()}
          >
            <Trans>Show earlier</Trans>
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Says which stone was deleted, when deleting one brought the athlete back here. */
function JustDeleted() {
  const fileName = useRouterState({ select: (state) => state.location.state.deleted });
  if (fileName === undefined) return null;

  return (
    <Alert>
      <AlertDescription>
        <Trans>Stone deleted. You can place it again from {fileName}.</Trans>
      </AlertDescription>
    </Alert>
  );
}

function NoStones({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-xs border border-dashed border-input/60 px-6 py-16 text-center',
        className,
      )}
    >
      <p className="font-semibold">
        <Trans>Stones: your completed activities</Trans>
      </p>
      <p className="max-w-sm text-muted-foreground">
        <Trans>
          Every run, ride, swim or session you finish becomes a stone. Place one from the .fit file your watch saved.
        </Trans>
      </p>
    </div>
  );
}
