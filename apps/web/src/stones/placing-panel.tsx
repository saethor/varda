import { Trans } from '@lingui/react/macro';
import { Button } from '@varda/ui/components/button';
import { cn } from '@varda/ui/lib/utils';
import { type DragEvent, useRef, useState } from 'react';
import { SomethingWentWrongAlert } from '../components/form.tsx';
import type { usePlaceStone } from '../lib/stones.ts';

/** Where a stone is placed from a watch file: dropped on the panel, or chosen with the file picker. */
export function PlacingPanel({ placing }: { placing: ReturnType<typeof usePlaceStone> }) {
  const picker = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const place = (file: File | undefined) => {
    if (file) placing.mutate({ file });
  };
  const reading = placing.isPending ? placing.variables.file.name : null;

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
      className={cn('flex flex-col gap-3 rounded-xl border bg-card p-5', dragging && 'border-primary bg-primary/5')}
    >
      <h2 id="place-a-stone" className="font-semibold">
        <Trans>Place a stone</Trans>
      </h2>
      <p className="text-muted-foreground">
        <Trans>Drop the .fit file your watch saved here, or choose it. One file at a time.</Trans>
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
      {placing.isError && <SomethingWentWrongAlert />}
    </section>
  );
}
