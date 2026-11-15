// PROTOTYPE, throw me away. The few bits every variant shares; layouts are each variant's own.

import { type ReactNode, useRef } from 'react';
import { duration, type Lap, paceOrSpeed, type Sport } from './fake.ts';

/** A button that opens the file picker for one .fit file. */
export function FilePicker({
  onFile,
  children,
}: {
  onFile: (fileName: string) => void;
  children: (open: () => void) => ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".fit"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file.name);
          e.target.value = '';
        }}
      />
      {children(() => input.current?.click())}
    </>
  );
}

export function LapsTable({ laps, sport }: { laps: Lap[]; sport: Sport }) {
  return (
    <table className="w-full text-sm tabular-nums">
      <thead className="text-left text-xs text-muted-foreground">
        <tr>
          <th className="py-1 font-normal">Lap</th>
          <th className="py-1 text-right font-normal">Distance</th>
          <th className="py-1 text-right font-normal">Time</th>
          <th className="py-1 text-right font-normal">{sport === 'cycling' ? 'Speed' : 'Pace'}</th>
        </tr>
      </thead>
      <tbody>
        {laps.map((lap, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: laps are positional
          <tr key={i} className="border-t">
            <td className="py-1">{i + 1}</td>
            <td className="py-1 text-right">
              {lap.distanceM < 1000 ? `${lap.distanceM} m` : `${(lap.distanceM / 1000).toFixed(2)} km`}
            </td>
            <td className="py-1 text-right">{duration(lap.movingS)}</td>
            <td className="py-1 text-right">{paceOrSpeed(sport, lap.distanceM, lap.movingS)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
