import type { Trace } from './stone.ts';

/** The most points a trace keeps, however long the session. */
const maxPoints = 300;
/** Points this close (in metres) to the simplified line are dropped, even under the cap. */
const tolerance = 1;
const metresPerDegree = 111_320;

/**
 * The trace of a session's positions: simplified with Ramer–Douglas–Peucker to at most 300
 * points, rounded to 5 decimals (about a metre). Positions are joined in order, so a pause is a
 * straight join. Fewer than 2 positions is no trace.
 */
export function traceOf(positions: Trace): Trace | null {
  if (positions.length < 2) return null;
  // Distances are measured flat on the ground, with longitude shrunk by the latitude.
  const lonScale = Math.cos(((positions[0]?.[0] ?? 0) * Math.PI) / 180);
  const points = positions.map(([lat, lon]) => [lon * lonScale * metresPerDegree, lat * metresPerDegree] as const);

  const importance = importanceOf(points);
  // RDP at a tolerance keeps exactly the points more important than it, so the cap only raises it.
  const ranked = importance.filter((each) => each > tolerance).sort((a, b) => b - a);
  const threshold = ranked.length > maxPoints ? (ranked[maxPoints] as number) : tolerance;

  return positions.flatMap(([lat, lon], i) =>
    (importance[i] as number) > threshold ? [[round(lat), round(lon)] as Trace[number]] : [],
  );
}

const round = (degrees: number) => Math.round(degrees * 1e5) / 1e5;

type Point = readonly [x: number, y: number];

/**
 * For each point, the largest Ramer–Douglas–Peucker tolerance that would still keep it: its
 * distance from the line when RDP splits on it, never more than its parent split's (so keeping
 * a point always keeps the points it hangs off). The ends are always kept. Uses a stack, so a
 * long session can't overflow.
 */
function importanceOf(points: readonly Point[]): number[] {
  const importance = new Array<number>(points.length).fill(0);
  importance[0] = Number.POSITIVE_INFINITY;
  importance[points.length - 1] = Number.POSITIVE_INFINITY;
  const stack: [first: number, last: number, ceiling: number][] = [[0, points.length - 1, Number.POSITIVE_INFINITY]];
  for (let span = stack.pop(); span !== undefined; span = stack.pop()) {
    const [first, last, ceiling] = span;
    let farthest = -1;
    let farthestDistance = 0;
    for (let i = first + 1; i < last; i++) {
      const distance = distanceToSegment(points[i] as Point, points[first] as Point, points[last] as Point);
      if (distance > farthestDistance) {
        farthest = i;
        farthestDistance = distance;
      }
    }
    if (farthest !== -1) {
      const kept = Math.min(farthestDistance, ceiling);
      importance[farthest] = kept;
      stack.push([first, farthest, kept], [farthest, last, kept]);
    }
  }
  return importance;
}

function distanceToSegment([x, y]: Point, [x1, y1]: Point, [x2, y2]: Point): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}
