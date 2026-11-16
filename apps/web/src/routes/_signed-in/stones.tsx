import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Alert, AlertDescription } from '@varda/ui/components/alert';
import { Button } from '@varda/ui/components/button';
import { calendarQuery, feedQuery, usePlaceStone } from '../../lib/stones.ts';
import { monthOf } from '../../stones/calendar-month.ts';
import { todayHere } from '../../stones/feed-window.ts';
import { PlacingPanel } from '../../stones/placing-panel.tsx';
import { StoneCard } from '../../stones/stone-card.tsx';
import { StonesCalendar, StonesHeading } from '../../stones/stones-calendar.tsx';
import { stonesSearch } from '../../stones/stones-view.ts';

export const Route = createFileRoute('/_signed-in/stones')({
  // Read once per visit, so every window of the feed counts back from the same day.
  beforeLoad: () => ({ today: todayHere(new Date()) }),
  validateSearch: stonesSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) =>
    deps.view === 'calendar'
      ? await context.queryClient.ensureQueryData(calendarQuery(deps.month ?? monthOf(context.today)))
      : await context.queryClient.ensureInfiniteQueryData(feedQuery(context.today)),
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
      <StonesCalendar month={month ?? monthOf(today)} />
    </section>
  );
}

function Stones() {
  const { today } = Route.useRouteContext();
  const feed = useSuspenseInfiniteQuery(feedQuery(today));
  const placing = usePlaceStone();
  const stones = feed.data.pages.flat();
  const placedFrom = placing.isSuccess ? placing.variables.file.name : null;

  return (
    <section className="flex flex-col gap-6">
      <StonesHeading view="feed" />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-8 lg:order-2">
          <PlacingPanel placing={placing} stones={stones} />
        </aside>
        <div className="flex flex-col gap-4 lg:order-1">
          {/* Until a stone opens on its own screen, the feed says where the new one came from. */}
          {placedFrom !== null && (
            <Alert>
              <AlertDescription>
                <Trans>Stone placed from {placedFrom}</Trans>
              </AlertDescription>
            </Alert>
          )}
          {stones.length === 0 ? <NoStones /> : stones.map((stone) => <StoneCard key={stone.id} stone={stone} />)}
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

function NoStones() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-16 text-center">
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
