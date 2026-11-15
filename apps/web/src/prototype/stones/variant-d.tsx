// PROTOTYPE, throw me away. Variant D, "Feed": stones as a feed of cards, newest first, using the
// desktop width. A card opens the stone on its own screen (/prototype/stones/$stoneId), not a
// modal or a side panel. Placing a stone lives in a rail beside the feed (above it on phones),
// and what happened shows there.

import { Link } from '@tanstack/react-router';
import { Button } from '@varda/ui/components/button';
import { useState } from 'react';
import { day, distance, duration, type Lap, paceOrSpeed, type Sport, type Stone, sportEmoji, time } from './fake.ts';
import { dismissNotice, placeFromFile, useFeed } from './feed-store.ts';
import type { PrototypeSearch } from './search.ts';
import { FilePicker } from './shared.tsx';

export function VariantD({ search }: { search: PrototypeSearch }) {
  const { stones, uploading, notice } = useFeed();
  const [dragging, setDragging] = useState(false);
  const place = (fileName: string) => void placeFromFile(fileName, search.next);
  const highlighted = notice?.kind === 'placed' ? notice.stone.id : null;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl">Stones</h1>
        <p className="text-sm text-muted-foreground">Your completed activities, newest first</p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-8 lg:order-2">
          <FilePicker onFile={place}>
            {(pick) => (
              // biome-ignore lint/a11y/noStaticElementInteractions: prototype drop zone; the button inside is the accessible way in
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) place(file.name);
                }}
                className={`flex flex-col gap-3 rounded-xl border p-5 ${dragging ? 'border-primary bg-accent' : 'bg-card'}`}
              >
                <h2 className="font-medium">Place a stone</h2>
                <p className="text-sm text-muted-foreground">
                  Drop the .fit file your watch saved, or choose it. One file at a time, up to 25 MB.
                </p>
                <Button onClick={pick} disabled={!!uploading}>
                  {uploading ? `Reading ${uploading}…` : 'Choose a watch file'}
                </Button>
              </div>
            )}
          </FilePicker>

          {notice && (
            <div
              className={`flex flex-col gap-1 rounded-xl border p-4 text-sm ${
                notice.kind === 'turned away' ? 'border-destructive' : ''
              }`}
            >
              {notice.kind === 'placed' && (
                <>
                  <p className="font-medium">✓ Stone placed</p>
                  <Link
                    to="/prototype/stones/$stoneId"
                    params={{ stoneId: notice.stone.id }}
                    search={search}
                    className="underline"
                  >
                    Open your {notice.stone.sport} from {day(notice.stone.localDate)}
                  </Link>
                </>
              )}
              {notice.kind === 'already placed' && (
                <>
                  <p className="font-medium">You've already placed this session</p>
                  <Link
                    to="/prototype/stones/$stoneId"
                    params={{ stoneId: notice.stone.id }}
                    search={search}
                    className="underline"
                  >
                    Open your {notice.stone.sport} from {day(notice.stone.localDate)}
                  </Link>
                </>
              )}
              {notice.kind === 'turned away' && (
                <>
                  <p className="font-medium text-destructive">No stone placed from {notice.fileName}</p>
                  <p className="text-muted-foreground">{notice.why} Nothing was kept.</p>
                </>
              )}
              {notice.kind === 'deleted' && (
                <p>
                  Your {notice.stone.sport} from {day(notice.stone.localDate)} was deleted, with its watch file.
                </p>
              )}
              <button
                type="button"
                className="self-end text-xs text-muted-foreground underline"
                onClick={dismissNotice}
              >
                Dismiss
              </button>
            </div>
          )}
        </aside>

        <div className="flex flex-col gap-4 lg:order-1">
          {stones.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-20 text-center">
              <div className="text-5xl opacity-30">🪨</div>
              <p className="font-medium">Stones: your completed activities</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Every run, ride, swim or session you finish becomes a stone. Place your first one from the .fit file
                your watch saved.
              </p>
            </div>
          ) : (
            stones.map((s) => <FeedCard key={s.id} stone={s} search={search} highlighted={s.id === highlighted} />)
          )}
        </div>
      </div>
    </section>
  );
}

function FeedCard({ stone, search, highlighted }: { stone: Stone; search: PrototypeSearch; highlighted: boolean }) {
  const pace = paceOrSpeed(stone.sport, stone.distanceM, stone.movingS);
  return (
    <Link
      to="/prototype/stones/$stoneId"
      params={{ stoneId: stone.id }}
      search={search}
      className={`group flex flex-col gap-4 rounded-xl border bg-card p-5 transition hover:border-foreground/30 hover:shadow-sm ${
        highlighted ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{sportEmoji[stone.sport]}</span>
          <div>
            <p className="text-lg capitalize group-hover:underline">{stone.sport}</p>
            <p className="text-sm text-muted-foreground">
              {day(stone.localDate)} · {time(stone.start)}
            </p>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">
          {stone.laps.length ? `${stone.laps.length} laps` : 'Totals only'}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-4 tabular-nums sm:grid-cols-4">
        {stone.distanceM !== null && <Stat label="Distance" value={distance(stone.distanceM)} />}
        <Stat label="Moving time" value={duration(stone.movingS)} />
        {pace && <Stat label={stone.sport === 'cycling' ? 'Speed' : 'Pace'} value={pace} />}
        <Stat label="Elapsed time" value={duration(stone.elapsedS)} />
      </dl>
      {stone.laps.length > 1 && <LapStrip laps={stone.laps} sport={stone.sport} />}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xl">{value}</dd>
    </div>
  );
}

/** Each lap as a bar: width by distance, height by speed. Laps only, no per-second data. */
export function LapStrip({ laps, sport, tall = false }: { laps: Lap[]; sport: Sport; tall?: boolean }) {
  const speeds = laps.map((l) => l.distanceM / l.movingS);
  const max = Math.max(...speeds);
  const min = Math.min(...speeds);
  return (
    <div className={`flex items-end gap-0.5 ${tall ? 'h-40' : 'h-12'}`}>
      {laps.map((lap, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: laps are positional
          key={i}
          title={`Lap ${i + 1}: ${distance(lap.distanceM)} in ${duration(lap.movingS)}, ${paceOrSpeed(sport, lap.distanceM, lap.movingS)}`}
          className="rounded-t bg-primary/70 hover:bg-primary"
          style={{
            flexGrow: lap.distanceM,
            flexBasis: 0,
            height: `${max === min ? 70 : 30 + (70 * (speeds[i]! - min)) / (max - min)}%`,
          }}
        />
      ))}
    </div>
  );
}
