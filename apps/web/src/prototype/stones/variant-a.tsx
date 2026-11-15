// PROTOTYPE, throw me away. Variant A, "Pages": a list page and a page per stone. Upload is a
// plain button; what happened is an alert on top of the list; placing goes straight to the
// new stone; delete is confirmed inline at the foot of the stone page.

import { Alert, AlertDescription, AlertTitle } from '@varda/ui/components/alert';
import { Button } from '@varda/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@varda/ui/components/card';
import { useState } from 'react';
import {
  day,
  distance,
  duration,
  type FakeStones,
  paceOrSpeed,
  type Stone,
  time,
  turnedAwayWhy,
  type UploadResult,
} from './fake.ts';
import { FilePicker, LapsTable } from './shared.tsx';

export function VariantA({ fake }: { fake: FakeStones }) {
  const [open, setOpen] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function place(fileName: string) {
    setResult(null);
    setNotice(null);
    const r = await fake.placeFromFile(fileName);
    if (r.kind === 'placed') {
      setNotice('Stone placed.');
      setOpen(r.stone.id);
    } else setResult(r);
  }

  const stone = fake.stones.find((s) => s.id === open);
  if (stone) {
    return (
      <StonePage
        stone={stone}
        notice={notice}
        onBack={() => {
          setOpen(null);
          setNotice(null);
        }}
        onDelete={() => {
          fake.deleteStone(stone.id);
          setOpen(null);
          setNotice(`Your ${stone.sport} stone from ${day(stone.localDate)} was deleted.`);
        }}
      />
    );
  }

  const uploadButton = (
    <FilePicker onFile={place}>
      {(pick) => (
        <Button onClick={pick} disabled={!!fake.uploading}>
          {fake.uploading ? `Reading ${fake.uploading}…` : 'Place a stone from a watch file'}
        </Button>
      )}
    </FilePicker>
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl">Stones</h1>
          <p className="text-sm text-muted-foreground">Your completed activities</p>
        </div>
        {fake.stones.length > 0 && uploadButton}
      </div>

      {notice && (
        <Alert>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      {result?.kind === 'already placed' && (
        <Alert>
          <AlertTitle>You've already placed this session</AlertTitle>
          <AlertDescription>
            <button type="button" className="underline" onClick={() => setOpen(result.stone.id)}>
              See your {result.stone.sport} stone from {day(result.stone.localDate)}
            </button>
          </AlertDescription>
        </Alert>
      )}
      {result?.kind === 'turned away' && (
        <Alert variant="destructive">
          <AlertTitle>No stone placed from {result.fileName}</AlertTitle>
          <AlertDescription>
            <p>{turnedAwayWhy[result.reason]}</p>
            <p>Nothing was kept.</p>
          </AlertDescription>
        </Alert>
      )}

      {fake.stones.length === 0 ? (
        <Card className="mx-auto w-full max-w-lg">
          <CardHeader>
            <CardTitle>No stones yet</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Stones</strong>: your completed activities. Place your first one from
              the .fit file your watch saved.
            </p>
            {uploadButton}
          </CardContent>
        </Card>
      ) : (
        <table className="w-full rounded-lg text-sm tabular-nums">
          <thead className="border-b text-left text-xs text-muted-foreground">
            <tr>
              <th className="py-2 font-normal">Date</th>
              <th className="py-2 font-normal">Sport</th>
              <th className="py-2 text-right font-normal">Distance</th>
              <th className="py-2 text-right font-normal">Moving time</th>
              <th className="hidden py-2 text-right font-normal md:table-cell">Elapsed time</th>
              <th className="hidden py-2 text-right font-normal md:table-cell">Pace / speed</th>
              <th className="hidden py-2 text-right font-normal lg:table-cell">Laps</th>
            </tr>
          </thead>
          <tbody>
            {fake.stones.map((s) => (
              <tr key={s.id} className="cursor-pointer border-b hover:bg-accent" onClick={() => setOpen(s.id)}>
                <td className="py-3">
                  {day(s.localDate)} <span className="hidden text-muted-foreground md:inline">· {time(s.start)}</span>
                </td>
                <td className="py-3 capitalize">{s.sport}</td>
                <td className="py-3 text-right">{distance(s.distanceM)}</td>
                <td className="py-3 text-right">{duration(s.movingS)}</td>
                <td className="hidden py-3 text-right text-muted-foreground md:table-cell">{duration(s.elapsedS)}</td>
                <td className="hidden py-3 text-right md:table-cell">
                  {paceOrSpeed(s.sport, s.distanceM, s.movingS) ?? '—'}
                </td>
                <td className="hidden py-3 text-right text-muted-foreground lg:table-cell">{s.laps.length || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function StonePage({
  stone,
  notice,
  onBack,
  onDelete,
}: {
  stone: Stone;
  notice: string | null;
  onBack: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const pace = paceOrSpeed(stone.sport, stone.distanceM, stone.movingS);

  const deleteArea = (
    <div>
      {confirming ? (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive p-4">
          <p className="text-sm">
            Delete this stone and the watch file it was placed from? This can't be undone. You can place it again from
            the same file.
          </p>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={onDelete}>
              Delete stone
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" className="text-destructive" onClick={() => setConfirming(true)}>
          Delete stone…
        </Button>
      )}
    </div>
  );

  return (
    <section className="flex flex-col gap-5">
      <button type="button" className="self-start text-sm underline" onClick={onBack}>
        ← Stones
      </button>
      {notice && (
        <Alert>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}
      <div>
        <h1 className="text-3xl capitalize">{stone.sport}</h1>
        <p className="text-sm text-muted-foreground">
          {day(stone.localDate)}, started {time(stone.start)}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-xl border p-5 md:grid-cols-4">
        {stone.distanceM !== null && <Fact label="Distance" value={distance(stone.distanceM)} />}
        <Fact label="Moving time" value={duration(stone.movingS)} />
        <Fact label="Elapsed time" value={duration(stone.elapsedS)} />
        {pace && <Fact label={stone.sport === 'cycling' ? 'Speed' : 'Pace'} value={pace} />}
      </dl>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <h2 className="mb-2 font-medium">Laps</h2>
          {stone.laps.length > 0 ? (
            <LapsTable laps={stone.laps} sport={stone.sport} />
          ) : (
            <p className="text-sm text-muted-foreground">A {stone.sport} stone keeps its totals only.</p>
          )}
        </div>
        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border p-4 text-sm">
            <h2 className="mb-2 font-medium">Recording</h2>
            <p className="text-muted-foreground">Placed from {stone.fileName}</p>
          </div>
          {deleteArea}
        </aside>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xl tabular-nums">{value}</dd>
    </div>
  );
}
