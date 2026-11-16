import { cn } from '@varda/ui/lib/utils';
import type { Stone } from '../lib/stones.ts';
import { lapStrip } from './lap-strip.ts';

/**
 * Each lap as a bar: width by distance, height by speed (see `lapStrip`); a lap with no speed is
 * paler. Decorative: the lap count, or the lap table beside it, says it in words. Nothing without laps.
 */
export function LapBars({ laps, className }: { laps: Stone['laps']; className?: string }) {
  const bars = lapStrip(laps);
  if (bars.length === 0) return null;
  return (
    <div className={cn('flex h-12 items-end gap-0.5', className)} aria-hidden>
      {bars.map((bar, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: laps are positional and never reorder
          key={i}
          className={cn('rounded-t-sm', bar.hasSpeed ? 'bg-primary/70' : 'bg-primary/25')}
          style={{ flexGrow: bar.width, flexBasis: 0, height: `${bar.height * 100}%` }}
        />
      ))}
    </div>
  );
}
