import type { Sport } from '@varda/shared';
import type { Split, Streams } from './stone.ts';

/** A whole kilometre, the length of every split but the last. */
const kilometre = 1000;

/**
 * Metres the altitude must move from where it last settled before it counts as a climb or a drop.
 * Below it is the altimeter's wobble (it reads in 0.2 m steps): summed point by point, that wobble
 * doubles a run's ascent. With 1.2 m, the splits' sums came within 4 m of the watch's own ascent
 * and descent on average, over 166 real FR255 runs and rides.
 */
const climbThreshold = 1.2;

/** A remainder shorter than this (a GPS wobble past the last whole kilometre) is no split. */
const shortestRemainder = 1;

/**
 * A stone's kilometre splits, worked out from its streams (the only thing Varða works out itself,
 * spec #74): each whole kilometre in order, then the remainder. None for a stone without distance,
 * and none for a swim, where kilometres of a pool mean nothing.
 *
 * Moving time counts only the intervals the timer ran (decision 2: an interval counts when the
 * point at its end has `timerRunning`). A kilometre ends between two points: the boundary is
 * placed by linear interpolation on distance, and the interval's time (and altitude) is shared
 * between the two splits in proportion, so a split's time doesn't depend on where the watch
 * happened to write a point. Within one second, that is as good as the recording is.
 */
export function splitsOf(streams: Streams | null, sport: Sport): Split[] {
  if (streams === null || streams.distance === null || sport === 'swimming') return [];
  const distance = carriedForward(streams.distance);
  const altitude = settled(streams.altitude);
  const splits: Split[] = [];
  let current = emptySplit();
  for (let i = 1; i < streams.offset.length; i++) {
    const interval = intervalOf(streams, distance, altitude, i);
    for (const piece of piecesOf(interval, (splits.length + 1) * kilometre)) {
      add(current, piece);
      if (piece.endsKilometre) {
        splits.push(finished(current, kilometre));
        current = emptySplit();
      }
    }
  }
  if (current.distance >= shortestRemainder) splits.push(finished(current, current.distance));
  return splits;
}

/** The distance at each point, the last known one carried over points the watch missed (0 before any). */
function carriedForward(distance: (number | null)[]): number[] {
  let last = 0;
  return distance.map((metres) => {
    // Distance never goes back: a dip is a wobble, not the athlete turning time around.
    last = metres === null ? last : Math.max(last, metres);
    return last;
  });
}

/**
 * The altitude at each point as it last settled: it moves only when the ground has risen or fallen
 * `climbThreshold` from there. None where the watch recorded none.
 */
function settled(altitude: Streams['altitude']): (number | null)[] {
  let anchor: number | null = null;
  return (altitude ?? []).map((metres) => {
    if (metres === null) return null;
    // Less a hair, so six 0.2 m steps aren't lost to rounding (21.2 - 20 is 1.1999…).
    if (anchor === null || Math.abs(metres - anchor) >= climbThreshold - 1e-9) anchor = metres;
    return anchor;
  });
}

/** What happened from point `i - 1` up to point `i`. */
type Interval = {
  from: number;
  to: number;
  /** Seconds the timer ran in it: all of it, or none. */
  movingTime: number;
  heartRate: number | null;
  altitudeFrom: number | null;
  altitudeTo: number | null;
};

function intervalOf(streams: Streams, distance: number[], altitude: (number | null)[], i: number): Interval {
  const moving = streams.timerRunning[i] === true;
  return {
    from: distance[i - 1] ?? 0,
    to: distance[i] ?? 0,
    movingTime: moving ? (streams.offset[i] ?? 0) - (streams.offset[i - 1] ?? 0) : 0,
    // The heart rate written at a point stands for the interval up to it.
    heartRate: streams.heartRate?.[i] ?? null,
    // A pause's climb isn't the split's: the watch counts none while stopped.
    altitudeFrom: moving ? (altitude[i - 1] ?? null) : null,
    altitudeTo: moving ? (altitude[i] ?? null) : null,
  };
}

/** A part of an interval within one split, and whether it reaches that split's last metre. */
type Piece = Interval & { endsKilometre: boolean };

/**
 * An interval cut at each kilometre boundary it reaches, from `boundary` (the end of the split it
 * starts in) on, its time and climb shared out by distance. Standing still, it is one piece.
 */
function piecesOf(interval: Interval, boundary: number): Piece[] {
  const { from, to } = interval;
  if (to === from) return [{ ...interval, endsKilometre: false }];
  const pieces: Piece[] = [];
  let start = from;
  for (let end = boundary; to >= end; end += kilometre) {
    pieces.push(pieceOf(interval, start, Math.max(start, end), true));
    start = Math.max(start, end);
  }
  if (to > start) pieces.push(pieceOf(interval, start, to, false));
  return pieces;
}

/** The part of a moving interval from `start` to `end` metres. */
function pieceOf(interval: Interval, start: number, end: number, endsKilometre: boolean): Piece {
  const { from, to, movingTime, altitudeFrom, altitudeTo } = interval;
  const share = (metres: number) => (metres - from) / (to - from);
  const altitudeAt = (metres: number) =>
    altitudeFrom === null || altitudeTo === null ? null : altitudeFrom + (altitudeTo - altitudeFrom) * share(metres);
  return {
    ...interval,
    from: start,
    to: end,
    movingTime: movingTime * (share(end) - share(start)),
    altitudeFrom: altitudeAt(start),
    altitudeTo: altitudeAt(end),
    endsKilometre,
  };
}

/** A split being summed up. */
type Sums = {
  distance: number;
  movingTime: number;
  heartbeats: number;
  heartRateTime: number;
  ascent: number;
  descent: number;
  climbed: boolean;
};

const emptySplit = (): Sums => ({
  distance: 0,
  movingTime: 0,
  heartbeats: 0,
  heartRateTime: 0,
  ascent: 0,
  descent: 0,
  climbed: false,
});

function add(sums: Sums, piece: Piece): void {
  sums.distance += piece.to - piece.from;
  sums.movingTime += piece.movingTime;
  if (piece.heartRate !== null) {
    sums.heartbeats += piece.heartRate * piece.movingTime;
    sums.heartRateTime += piece.movingTime;
  }
  if (piece.altitudeFrom !== null && piece.altitudeTo !== null) {
    const climb = piece.altitudeTo - piece.altitudeFrom;
    sums.ascent += Math.max(climb, 0);
    sums.descent += Math.max(-climb, 0);
    sums.climbed = true;
  }
}

function finished(sums: Sums, distance: number): Split {
  return {
    distance,
    movingTime: sums.movingTime,
    averageHeartRate: sums.heartRateTime > 0 ? sums.heartbeats / sums.heartRateTime : null,
    ascent: sums.climbed ? sums.ascent : null,
    descent: sums.climbed ? sums.descent : null,
  };
}
