// PROTOTYPE, throw me away. Variant D, "Feed": stones as a feed of cards, newest first, using the
// desktop width, with a toggle to a calendar of weeks (Mon–Sun, with week totals). A stone opens
// on its own screen (/prototype/stones/$stoneId), never a modal or a side panel; so does a stone
// just placed. Placing lives in a rail beside the stones (above them on phones). Each card draws
// its GPS track top right: just the line, no map.

import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@varda/ui/components/button';
import { useState } from 'react';
import {
  day,
  distance,
  duration,
  type Lap,
  type Point,
  paceOrSpeed,
  type Sport,
  type Stone,
  sportEmoji,
  time,
} from './fake.ts';
import { dismissNotice, placeFromFile, useFeed } from './feed-store.ts';
import type { PrototypeSearch } from './search.ts';
import { FilePicker } from './shared.tsx';

export function VariantD({ search }: { search: PrototypeSearch }) {
  const { stones, uploading, notice } = useFeed();
  const [dragging, setDragging] = useState(false);
  const navigate = useNavigate();
  const place = async (fileName: string) => {
    const result = await placeFromFile(fileName, search.next);
    if (result?.kind === 'placed')
      await navigate({ to: '/prototype/stones/$stoneId', params: { stoneId: result.stone.id }, search });
  };
  const highlighted = notice?.kind === 'placed' ? notice.stone.id : null;
  // The calendar takes the full width; placing becomes a slim bar above it.
  const wide = search.view === 'calendar';
  const view = (to: PrototypeSearch['view']) => (
    <Link
      to="/prototype/stones"
      search={{ ...search, view: to }}
      replace
      className={`rounded-md px-3 py-1.5 text-sm capitalize ${search.view === to ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
    >
      {to}
    </Link>
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Stones</h1>
          <p className="text-sm text-muted-foreground">Your completed activities</p>
        </div>
        <nav className={`flex gap-1 rounded-lg bg-muted p-1 ${wide ? '' : 'lg:mr-[22rem]'}`}>
          {view('feed')}
          {view('calendar')}
        </nav>
      </div>

      <div className={`grid items-start gap-8 ${wide ? '' : 'lg:grid-cols-[minmax(0,1fr)_20rem]'}`}>
        <aside className={`flex flex-col gap-4 ${wide ? '' : 'lg:sticky lg:top-8 lg:order-2'}`}>
          <FilePicker onFile={(f) => void place(f)}>
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
                  if (file) void place(file.name);
                }}
                className={`flex flex-col gap-3 rounded-xl border p-5 ${wide ? 'lg:flex-row lg:items-center lg:justify-between lg:py-3' : ''} ${dragging ? 'border-primary bg-accent' : 'bg-card'}`}
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
          ) : search.view === 'calendar' ? (
            <Calendar stones={stones} search={search} />
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{sportEmoji[stone.sport]}</span>
          <div>
            <p className="text-lg capitalize group-hover:underline">{stone.sport}</p>
            <p className="text-sm text-muted-foreground">
              {day(stone.localDate)} · {time(stone.start)} ·{' '}
              {stone.laps.length ? `${stone.laps.length} laps` : 'totals only'}
            </p>
          </div>
        </div>
        {stone.track && <Track points={stone.track} className="h-20 w-32 shrink-0 text-primary" />}
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

/** The GPS track as a line on a transparent background: no map, north up, true proportions. */
export function Track({ points, className }: { points: Point[]; className?: string }) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const size = Math.max(maxX - minX, maxY - minY) || 1;
  const pad = size * 0.06;
  // SVG's y grows downwards; flip so north is up.
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${(x - minX).toFixed(0)} ${(maxY - y).toFixed(0)}`).join('');
  return (
    <svg
      viewBox={`${-pad} ${-pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`}
      preserveAspectRatio="xMaxYMid meet"
      className={className}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function addDays(localDate: string, days: number) {
  const d = new Date(`${localDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function monday(localDate: string) {
  const d = new Date(`${localDate}T12:00:00`);
  return addDays(localDate, -((d.getDay() + 6) % 7));
}

/** Weeks, newest first: Mon–Sun cells with the week's totals at the end. A list per week on phones. */
function Calendar({ stones, search }: { stones: Stone[]; search: PrototypeSearch }) {
  const weeks = new Map<string, Stone[]>();
  for (const s of stones) {
    const w = monday(s.localDate);
    weeks.set(w, [...(weeks.get(w) ?? []), s]);
  }
  return (
    <div className="flex flex-col gap-6">
      {[...weeks].map(([week, inWeek]) => {
        const km = inWeek.reduce((sum, s) => sum + (s.distanceM ?? 0), 0) / 1000;
        const secs = inWeek.reduce((sum, s) => sum + s.movingS, 0);
        return (
          <div key={week}>
            <h2 className="mb-2 text-sm font-medium">
              Week of {day(week, 'short')}{' '}
              <span className="font-normal text-muted-foreground lg:hidden">
                · {inWeek.length} stones · {km.toFixed(1)} km · {duration(secs)}
              </span>
            </h2>
            <div className="hidden grid-cols-[repeat(7,minmax(0,1fr))_7.5rem] gap-1.5 lg:grid">
              {Array.from({ length: 7 }, (_, i) => {
                const date = addDays(week, i);
                return (
                  <div key={date} className="flex min-h-32 flex-col gap-1 rounded-lg border border-dashed p-1">
                    <span className="px-1 text-xs text-muted-foreground">{day(date, 'short')}</span>
                    {inWeek
                      .filter((s) => s.localDate === date)
                      .map((s) => (
                        <CalendarStone key={s.id} stone={s} search={search} />
                      ))}
                  </div>
                );
              })}
              <div className="flex flex-col justify-center gap-0.5 rounded-lg bg-muted/60 p-3 text-sm tabular-nums">
                <span className="text-xs text-muted-foreground">{inWeek.length} stones</span>
                <span className="text-lg">{km.toFixed(1)} km</span>
                <span className="text-muted-foreground">{duration(secs)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 lg:hidden">
              {inWeek.map((s) => (
                <CalendarStone key={s.id} stone={s} search={search} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CalendarStone({ stone, search }: { stone: Stone; search: PrototypeSearch }) {
  return (
    <Link
      to="/prototype/stones/$stoneId"
      params={{ stoneId: stone.id }}
      search={search}
      className="flex flex-col rounded-md bg-card px-2 py-1.5 shadow-xs hover:ring-1 hover:ring-foreground/30"
    >
      <span className="truncate text-xs text-muted-foreground capitalize">
        {sportEmoji[stone.sport]} {stone.sport}
        <span className="lg:hidden"> · {day(stone.localDate, 'short')}</span>
      </span>
      <span className="flex items-end justify-between gap-1">
        <span className="flex flex-col">
          <span className="whitespace-nowrap tabular-nums">
            {stone.distanceM !== null ? distance(stone.distanceM) : duration(stone.movingS)}
          </span>
          {stone.distanceM !== null && (
            <span className="text-xs text-muted-foreground tabular-nums">{duration(stone.movingS)}</span>
          )}
        </span>
        {stone.track && <Track points={stone.track} className="h-8 w-10 shrink-0 text-primary/70" />}
      </span>
    </Link>
  );
}
