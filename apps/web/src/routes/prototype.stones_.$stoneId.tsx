// PROTOTYPE, throw me away. Variant D's stone screen: a stone opens as its own page, not a modal
// or a side panel. Laps as bars and a table side by side on desktop; delete confirmed inline.

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@varda/ui/components/button';
import { useState } from 'react';
import { day, distance, duration, paceOrSpeed, sportEmoji, time } from '../prototype/stones/fake.ts';
import { deleteStone, startFeed, useFeed } from '../prototype/stones/feed-store.ts';
import { prototypeSearch } from '../prototype/stones/search.ts';
import { LapsTable } from '../prototype/stones/shared.tsx';
import { LapStrip } from '../prototype/stones/variant-d.tsx';

export const Route = createFileRoute('/prototype/stones_/$stoneId')({
  validateSearch: prototypeSearch,
  component: StoneScreen,
});

function StoneScreen() {
  const search = Route.useSearch();
  startFeed(search.start);
  const { stoneId } = Route.useParams();
  const navigate = useNavigate();
  const { stones } = useFeed();
  const [confirming, setConfirming] = useState(false);
  const stone = stones.find((s) => s.id === stoneId);
  const back = (
    <Link to="/prototype/stones" search={search} className="self-start text-sm underline">
      ← Stones
    </Link>
  );

  if (!stone) {
    return (
      <section className="flex flex-col gap-4">
        {back}
        <h1 className="text-2xl">There's no such stone</h1>
        <p className="text-sm text-muted-foreground">It may have been deleted.</p>
      </section>
    );
  }

  const pace = paceOrSpeed(stone.sport, stone.distanceM, stone.movingS);

  return (
    <section className="flex flex-col gap-8">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {day(stone.localDate)} · started {time(stone.start)}
          </p>
          <h1 className="text-4xl capitalize">
            {sportEmoji[stone.sport]} {stone.sport}
          </h1>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-6 rounded-xl border bg-card p-6 tabular-nums md:grid-cols-4">
        {stone.distanceM !== null && <Big label="Distance" value={distance(stone.distanceM)} />}
        <Big label="Moving time" value={duration(stone.movingS)} />
        {pace && <Big label={stone.sport === 'cycling' ? 'Speed' : 'Pace'} value={pace} />}
        <Big label="Elapsed time" value={duration(stone.elapsedS)} />
      </dl>

      <div>
        <h2 className="mb-3 text-lg">Laps</h2>
        {stone.laps.length > 0 ? (
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-4">
              <LapStrip laps={stone.laps} sport={stone.sport} tall />
              <p className="mt-2 text-xs text-muted-foreground">Taller is faster; wider is longer.</p>
            </div>
            <LapsTable laps={stone.laps} sport={stone.sport} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">A {stone.sport} stone keeps its totals only.</p>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t pt-6 text-sm">
        <p className="text-muted-foreground">Placed from {stone.fileName}</p>
        {confirming ? (
          <div className="flex max-w-xl flex-col gap-3 rounded-lg border border-destructive p-4">
            <p>
              Delete this stone and the watch file it was placed from? This can't be undone. You can place it again from
              the same file.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  deleteStone(stone);
                  void navigate({ to: '/prototype/stones', search });
                }}
              >
                Delete stone
              </Button>
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                Keep it
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="self-start text-destructive" onClick={() => setConfirming(true)}>
            Delete stone…
          </Button>
        )}
      </div>
    </section>
  );
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-3xl">{value}</dd>
    </div>
  );
}
