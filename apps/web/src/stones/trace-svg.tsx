import { type Trace, traceLine } from './trace-line.ts';

/** A stone's trace as a line on a transparent background: north up, true proportions, no map. */
export function TraceSvg({
  trace,
  align = 'end',
  markStart = false,
  weight = 2,
  className,
}: {
  trace: Trace;
  /** Where the trace sits when its box is wider or taller than it: top right, or centred. */
  align?: 'end' | 'center';
  /** Mark where the stone started with a dot. */
  markStart?: boolean;
  /** The line's width in screen pixels. */
  weight?: number;
  className?: string;
}) {
  const { points, width, height } = traceLine(trace);
  const pad = Math.max(width, height) * 0.05;
  const start = points[0];
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
        strokeWidth={weight}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {markStart && start && (
        <circle cx={start[0]} cy={start[1]} r={Math.max(width, height) * 0.016} fill="currentColor" />
      )}
    </svg>
  );
}
