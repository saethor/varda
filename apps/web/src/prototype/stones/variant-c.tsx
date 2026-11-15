// PROTOTYPE, throw me away. Variant C, "Weeks": stones grouped by week with week totals, a
// floating "Place a stone" button, a stone opens as a bottom sheet over the list, and what
// happened shows as a toast. Delete has no confirmation: it's undoable for a few seconds and
// only really deleted when the toast goes (the server call would wait for that).

import { Button } from '@varda/ui/components/button';
import { useEffect, useState } from 'react';
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
} from './fake.ts';
import { FilePicker, LapsTable } from './shared.tsx';

type Toast =
  | { kind: 'placed'; stone: Stone }
  | { kind: 'already placed'; stone: Stone }
  | { kind: 'turned away'; title: string; why: string }
  | { kind: 'deleted'; stone: Stone };

function monday(localDate: string) {
  const d = new Date(`${localDate}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function VariantC({ fake }: { fake: FakeStones }) {
  const [open, setOpen] = useState<Stone | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), toast.kind === 'turned away' ? 9000 : 6000);
    return () => clearTimeout(id);
  }, [toast]);

  async function place(fileName: string) {
    const r = await fake.placeFromFile(fileName);
    if (r.kind === 'turned away')
      setToast({ kind: 'turned away', title: `No stone from ${r.fileName}`, why: turnedAwayWhy[r.reason] });
    else setToast(r);
  }

  const weeks = new Map<string, Stone[]>();
  for (const s of fake.stones) {
    const w = monday(s.localDate);
    weeks.set(w, [...(weeks.get(w) ?? []), s]);
  }

  return (
    <section className="flex flex-col gap-6 pb-32">
      <h1 className="text-2xl">Stones</h1>

      {fake.stones.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <div className="text-5xl opacity-30">🪨</div>
          <p className="font-medium">Stones: your completed activities</p>
          <p className="text-sm text-muted-foreground">
            Every run, ride, swim or session you finish becomes a stone. Tap <strong>Place a stone</strong> and pick the
            .fit file your watch saved.
          </p>
        </div>
      ) : (
        [...weeks].map(([week, stones]) => <Week key={week} week={week} stones={stones} onOpen={setOpen} />)
      )}

      <FilePicker onFile={place}>
        {(pick) => (
          <Button
            size="lg"
            className="fixed right-6 bottom-20 z-30 rounded-full shadow-lg"
            onClick={pick}
            disabled={!!fake.uploading}
          >
            {fake.uploading ? 'Reading…' : '+ Place a stone'}
          </Button>
        )}
      </FilePicker>

      {open && (
        <Sheet
          stone={open}
          onClose={() => setOpen(null)}
          onDelete={() => {
            fake.deleteStone(open.id);
            setOpen(null);
            setToast({ kind: 'deleted', stone: open });
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-32 left-1/2 z-50 flex w-[22rem] -translate-x-1/2 items-start justify-between gap-3 rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-xl">
          <div>
            {toast.kind === 'placed' && (
              <p>
                Stone placed: {toast.stone.sport}, {day(toast.stone.localDate, 'short')}
              </p>
            )}
            {toast.kind === 'already placed' && <p>You already have this stone.</p>}
            {toast.kind === 'turned away' && (
              <>
                <p className="font-medium">{toast.title}</p>
                <p className="opacity-80">{toast.why} Nothing was kept.</p>
              </>
            )}
            {toast.kind === 'deleted' && <p>Stone deleted.</p>}
          </div>
          {(toast.kind === 'placed' || toast.kind === 'already placed') && (
            <button
              type="button"
              className="shrink-0 font-medium underline"
              onClick={() => {
                setOpen(toast.stone);
                setToast(null);
              }}
            >
              Open
            </button>
          )}
          {toast.kind === 'deleted' && (
            <button
              type="button"
              className="shrink-0 font-medium underline"
              onClick={() => {
                fake.restoreStone(toast.stone);
                setToast(null);
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function Week({ week, stones, onOpen }: { week: string; stones: Stone[]; onOpen: (s: Stone) => void }) {
  const km = stones.reduce((sum, s) => sum + (s.distanceM ?? 0), 0) / 1000;
  const secs = stones.reduce((sum, s) => sum + s.movingS, 0);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between border-b pb-1">
        <h2 className="text-sm font-medium">Week of {day(week, 'short')}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {stones.length} stones · {km.toFixed(1)} km · {duration(secs)}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {stones.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onOpen(s)}
            className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3 text-left hover:bg-accent"
          >
            <span className="text-2xl">{sportEmoji[s.sport]}</span>
            <span className="flex-1">
              <span className="block text-xs text-muted-foreground">{day(s.localDate, 'short')}</span>
              <span className="text-lg tabular-nums">
                {s.distanceM !== null ? distance(s.distanceM) : duration(s.movingS)}
              </span>{' '}
              <span className="text-sm text-muted-foreground capitalize">{s.sport}</span>
            </span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {s.distanceM !== null && duration(s.movingS)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Sheet({ stone, onClose, onDelete }: { stone: Stone; onClose: () => void; onDelete: () => void }) {
  const pace = paceOrSpeed(stone.sport, stone.distanceM, stone.movingS);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40">
      <button type="button" aria-label="Close" className="absolute inset-0" onClick={onClose} />
      <div className="relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-background p-6 pb-24 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          {day(stone.localDate)} · {time(stone.start)}
        </p>
        <h2 className="mb-4 text-2xl capitalize">
          {sportEmoji[stone.sport]} {stone.sport}
        </h2>
        <div className="mb-6 flex justify-between text-center tabular-nums">
          {stone.distanceM !== null && <Big label="km" value={(stone.distanceM / 1000).toFixed(2)} />}
          <Big label="moving" value={duration(stone.movingS)} />
          <Big label="elapsed" value={duration(stone.elapsedS)} />
          {pace && (
            <Big label={stone.sport === 'cycling' ? 'speed' : 'pace'} value={pace.replace(/ \/.*| km\/h/, '')} />
          )}
        </div>
        {stone.laps.length > 0 && <LapsTable laps={stone.laps} sport={stone.sport} />}
        <div className="mt-6 flex justify-between">
          <Button variant="ghost" className="text-destructive" onClick={onDelete}>
            Delete
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function Big({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xl">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
