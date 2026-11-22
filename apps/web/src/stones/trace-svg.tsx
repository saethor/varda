import { type Trace, traceLine } from './trace-line.ts';

/** A stone's trace as a line on a transparent background: north up, true proportions, no map. */
export function TraceSvg({
  trace,
  align = 'end',
  className,
}: {
  trace: Trace;
  /** Where the trace sits when its box is wider or taller than it: top right, or centred. */
  align?: 'end' | 'center';
  className?: string;
}) {
  const { points, width, height } = traceLine(trace);
  const pad = Math.max(width, height) * 0.05;
  const d = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  return (
    <svg
      viewBox={`${-pad} ${-pad} ${width + 2 * pad} ${height + 2 * pad}`}
      preserveAspectRatio={align === 'end' ? 'xMaxYMin meet' : 'xMidYMid meet'}
      className={className}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
