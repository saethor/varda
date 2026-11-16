import { Trans } from '@lingui/react/macro';
import { isDefinedError } from '@orpc/client';
import { Button } from '@varda/ui/components/button';
import { cn } from '@varda/ui/lib/utils';
import { type DragEvent, useRef, useState } from 'react';
import { SomethingWentWrongAlert } from '../components/form.tsx';
import type { Stone, usePlaceStone } from '../lib/stones.ts';
import { checkWatchFile } from './check-watch-file.ts';
import { PlacingRefusal, type Refusal } from './placing-refusal.tsx';

/**
 * Where a stone is placed from a watch file: dropped on the panel, or chosen with the file picker.
 * `stones` are the stones as loaded (the feed, or the month on screen), to name the stone a session
 * was already placed as.
 */
export function PlacingPanel({
  placing,
  stones,
  className,
}: {
  placing: ReturnType<typeof usePlaceStone>;
  stones: Stone[];
  /** Lays the panel out where it sits: beside the feed, or as a slim bar above the calendar. */
  className?: string;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  // A file the browser turned away without sending it.
  const [turnedAwayHere, setTurnedAwayHere] = useState<Refusal | null>(null);
  const place = (file: File | undefined) => {
    if (!file) return;
    const reason = checkWatchFile(file);
    setTurnedAwayHere(reason === null ? null : { turnedAway: reason });
    if (reason === null) {
      placing.mutate({ file });
    } else {
      placing.reset();
    }
  };
  const reading = placing.isPending ? placing.variables.file.name : null;
  const refusal = turnedAwayHere ?? refusalOf(placing.error);

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    place(event.dataTransfer.files[0]);
  };

  return (
    <section
      aria-labelledby="place-a-stone"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'flex flex-col gap-3 rounded-xl border bg-card p-5',
        className,
        dragging && 'border-primary bg-primary/5',
      )}
    >
      <h2 id="place-a-stone" className="font-semibold">
        <Trans>Place a stone</Trans>
      </h2>
      <p className="text-muted-foreground">
        <Trans>Drop the .fit file your watch saved here, or choose it. One file at a time, up to 25 MB.</Trans>
      </p>
      <input
        ref={picker}
        type="file"
        accept=".fit"
        className="hidden"
        onChange={(event) => {
          place(event.target.files?.[0]);
          // So choosing the same file again places it again.
          event.target.value = '';
        }}
      />
      <Button className="self-start" disabled={reading !== null} onClick={() => picker.current?.click()}>
        {reading === null ? <Trans>Choose a watch file</Trans> : <Trans>Reading {reading}…</Trans>}
      </Button>
      {refusal !== null ? (
        <PlacingRefusal refusal={refusal} stones={stones} />
      ) : (
        placing.isError && <SomethingWentWrongAlert />
      )}
    </section>
  );
}

/** Why the server didn't place the stone, or null when it failed for some other reason (or didn't). */
function refusalOf(error: ReturnType<typeof usePlaceStone>['error']): Refusal | null {
  if (!isDefinedError(error)) return null;
  if (error.code === 'ALREADY_PLACED') return { alreadyPlaced: error.data.stoneId };
  if (error.code === 'TURNED_AWAY') return { turnedAway: error.data.reason };
  return null;
}
