// PROTOTYPE, throw me away. Variant B, "Drop zone": one page, list beside detail on desktop. A drop zone sits on top and
// becomes the answer (placed / already placed / turned away) in place. Stones are a dense
// table; a row expands in place to show its summary and laps. Delete is confirmed in a modal.

import { Button } from '@varda/ui/components/button';
import { useState } from 'react';
import {
  day,
  distance,
  duration,
  type FakeStones,
  paceOrSpeed,
  type Stone,
  sportEmoji,
  time,
  turnedAwayWhy,
  type UploadResult,
} from './fake.ts';
import { FilePicker, LapsTable } from './shared.tsx';

export function VariantB({ fake }: { fake: FakeStones }) {
  const [open, setOpen] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const [deleting, setDeleting] = useState<Stone | null>(null);

  async function place(fileName: string) {
    setResult(null);
    const r = await fake.placeFromFile(fileName);
    setResult(r);
    if (r.kind !== 'turned away') setOpen(r.stone.id);
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl">
        Stones <span className="text-sm text-muted-foreground">your completed activities</span>
      </h1>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="flex flex-col gap-4">
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
                  if (file) void place(file.name);
                }}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm ${
                  dragging ? 'border-primary bg-accent' : ''
                } ${result?.kind === 'turned away' ? 'border-destructive' : ''}`}
              >
                {fake.uploading ? (
                  <p>Reading {fake.uploading}…</p>
                ) : result?.kind === 'placed' ? (
                  <>
                    <p className="text-lg">✓ Stone placed</p>
                    <p className="text-muted-foreground">
                      {sportEmoji[result.stone.sport]} {result.stone.sport}, {distance(result.stone.distanceM)},{' '}
                      {day(result.stone.localDate)}
                    </p>
                    <DropAnother pick={pick} />
                  </>
                ) : result?.kind === 'already placed' ? (
                  <>
                    <p className="text-lg">Already placed</p>
                    <p className="text-muted-foreground">
                      This session is already one of your stones: {result.stone.sport} on {day(result.stone.localDate)}.
                      It's opened below.
                    </p>
                    <DropAnother pick={pick} />
                  </>
                ) : result?.kind === 'turned away' ? (
                  <>
                    <p className="text-lg text-destructive">Couldn't place a stone from {result.fileName}</p>
                    <p className="text-muted-foreground">{turnedAwayWhy[result.reason]} Nothing was kept.</p>
                    <DropAnother pick={pick} />
                  </>
                ) : (
                  <>
                    <p className="text-lg">Drop a .fit file from your watch here</p>
                    <p className="text-muted-foreground">One file at a time, up to 25 MB.</p>
                    <Button variant="outline" size="sm" onClick={pick}>
                      Choose a file
                    </Button>
                  </>
                )}
              </div>
            )}
          </FilePicker>

          {fake.stones.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No stones yet. <strong className="text-foreground">Stones</strong> are your completed activities, of any
              sport. Each watch file you drop above places one.
            </p>
          ) : (
            <table className="w-full text-sm tabular-nums">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-1 font-normal">Date</th>
                  <th className="py-1 font-normal">Sport</th>
                  <th className="py-1 text-right font-normal">Distance</th>
                  <th className="py-1 text-right font-normal">Time</th>
                  <th className="hidden py-1 text-right font-normal xl:table-cell">Pace / speed</th>
                </tr>
              </thead>
              <tbody>
                {fake.stones.map((s) => (
                  <Row
                    key={s.id}
                    stone={s}
                    open={open === s.id}
                    onToggle={() => setOpen(open === s.id ? null : s.id)}
                    onDelete={() => setDeleting(s)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Desktop: the open stone sits beside the list. Phones expand the row in place instead. */}
        <aside className="sticky top-8 hidden rounded-xl border p-6 lg:block">
          {(() => {
            const stone = fake.stones.find((x) => x.id === open);
            return stone ? (
              <Detail stone={stone} onDelete={() => setDeleting(stone)} big />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">
                {fake.stones.length ? 'Pick a stone to see its laps.' : 'Your stones will show here.'}
              </p>
            );
          })()}
        </aside>
      </div>

      {deleting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-6">
          <div role="dialog" aria-modal className="flex max-w-sm flex-col gap-4 rounded-xl bg-background p-6 shadow-xl">
            <h2 className="text-lg font-medium">Delete this stone?</h2>
            <p className="text-sm text-muted-foreground">
              Your {deleting.sport} from {day(deleting.localDate)} ({distance(deleting.distanceM)}) and its watch file
              will be gone for good.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  fake.deleteStone(deleting.id);
                  setDeleting(null);
                  setResult(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function DropAnother({ pick }: { pick: () => void }) {
  return (
    <Button variant="link" size="sm" onClick={pick}>
      Place another
    </Button>
  );
}

function Row({
  stone,
  open,
  onToggle,
  onDelete,
}: {
  stone: Stone;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const pace = paceOrSpeed(stone.sport, stone.distanceM, stone.movingS);
  return (
    <>
      <tr
        className={`cursor-pointer border-t hover:bg-accent ${open ? 'bg-accent lg:font-medium' : ''}`}
        onClick={onToggle}
      >
        <td className="py-2">{day(stone.localDate, 'short')}</td>
        <td className="py-2">
          {sportEmoji[stone.sport]} <span className="capitalize">{stone.sport}</span>
        </td>
        <td className="py-2 text-right">{distance(stone.distanceM)}</td>
        <td className="py-2 text-right">{duration(stone.movingS)}</td>
        <td className="hidden py-2 text-right text-muted-foreground xl:table-cell">
          {paceOrSpeed(stone.sport, stone.distanceM, stone.movingS) ?? '—'}
        </td>
      </tr>
      {open && (
        <tr className="bg-accent/40 lg:hidden">
          <td colSpan={4} className="px-3 pt-2 pb-4">
            <Detail stone={stone} onDelete={onDelete} />
          </td>
        </tr>
      )}
    </>
  );
}

function Detail({ stone, onDelete, big = false }: { stone: Stone; onDelete: () => void; big?: boolean }) {
  const pace = paceOrSpeed(stone.sport, stone.distanceM, stone.movingS);
  return (
    <div className="flex flex-col gap-3">
      {big && (
        <div>
          <p className="text-sm text-muted-foreground">
            {day(stone.localDate)} · started {time(stone.start)}
          </p>
          <h2 className="text-2xl capitalize">
            {sportEmoji[stone.sport]} {stone.sport}
          </h2>
        </div>
      )}
      {big ? (
        <dl className="grid grid-cols-4 gap-3 border-y py-4 tabular-nums">
          <Fact label="Distance" value={distance(stone.distanceM)} />
          <Fact label="Moving" value={duration(stone.movingS)} />
          <Fact label="Elapsed" value={duration(stone.elapsedS)} />
          <Fact label={stone.sport === 'cycling' ? 'Speed' : 'Pace'} value={pace ?? '—'} />
        </dl>
      ) : (
        <p className="text-xs text-muted-foreground">
          Started {time(stone.start)} · moving {duration(stone.movingS)} · elapsed {duration(stone.elapsedS)}
          {pace && ` · ${pace}`}
        </p>
      )}
      {stone.laps.length > 0 ? (
        <LapsTable laps={stone.laps} sport={stone.sport} />
      ) : (
        <p className="text-xs text-muted-foreground">No laps: a {stone.sport} stone keeps its totals only.</p>
      )}
      <div className="flex justify-end">
        <Button variant="ghost" size={big ? 'sm' : 'xs'} className="text-destructive" onClick={onDelete}>
          Delete stone
        </Button>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg">{value}</dd>
    </div>
  );
}
