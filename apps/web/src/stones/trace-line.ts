/** A stone's trace: `[lat, lon]` pairs in degrees. */
export type Trace = [lat: number, lon: number][];

/** A trace laid out flat for drawing: points in metres from the top left, north up. */
export type TraceLine = { points: [x: number, y: number][]; width: number; height: number };

/** Metres in a degree of latitude, on a sphere the Earth's mean radius. */
const metresPerDegree = (6_371_000 * Math.PI) / 180;

/**
 * Lays a trace out north up and in true proportions: a degree of longitude is shrunk by the
 * cosine of the latitude, as it is on the ground. Good for the few kilometres a session covers.
 */
export function traceLine(trace: Trace): TraceLine {
  const lats = trace.map(([lat]) => lat);
  const lons = trace.map(([, lon]) => lon);
  const [south, north] = [Math.min(...lats), Math.max(...lats)];
  const west = Math.min(...lons);
  const lonScale = Math.cos((((south + north) / 2) * Math.PI) / 180);

  const points = trace.map(
    ([lat, lon]) => [(lon - west) * lonScale * metresPerDegree, (north - lat) * metresPerDegree] as [number, number],
  );
  const width = Math.max(...points.map(([x]) => x));
  const height = Math.max(...points.map(([, y]) => y));
  // A line straight north–south or east–west has no width or height; give it a sliver to sit in.
  const least = Math.max(width, height, 1) / 100;
  return { points, width: Math.max(width, least), height: Math.max(height, least) };
}
