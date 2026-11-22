import { cn } from '@varda/ui/lib/utils';
import { cairnStones, stoneHeight } from './week-cairn.ts';

/**
 * The week so far as a small cairn, a stone per stone placed, all the same size however long the
 * session: what grows is showing up, not effort. The newest stone is the Moss capstone and, just
 * after placing, settles onto the stack. Decorative: the place line says the same in words.
 */
export function WeekCairnMark({ count, className }: { count: number; className?: string }) {
  const stones = cairnStones(count);
  const base = stones.at(-1);
  if (base === undefined) return null;
  const width = base.width;
  const height = base.y + stoneHeight;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      // A stone is 5px tall here, the stack capped so a busy week still fits beside a line of text.
      style={{ height: `min(${height / 4}px, 5.5rem)` }}
      className={cn('w-auto shrink-0 overflow-visible', className)}
      aria-hidden
    >
      {stones.map((stone, i) => (
        <rect
          // biome-ignore lint/suspicious/noArrayIndexKey: a cairn's stones are positional
          key={i}
          x={stone.x}
          y={stone.y}
          width={stone.width}
          height={stoneHeight}
          rx={4}
          className={i === 0 ? 'fill-moss motion-safe:animate-stone-settle' : 'fill-foreground'}
        />
      ))}
    </svg>
  );
}
