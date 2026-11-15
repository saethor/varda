// PROTOTYPE, throw me away. In-memory stones for "How should the stone screens look?" (#39 on map #35).
// Nothing here talks to the API: placing and deleting are stubs, and the outcome of the next
// upload is picked in the floating bar, so every screen can be reached without real FIT files.
// Strings are plain English on purpose: wording and Icelandic are still open on the map.

import { useState } from 'react';

export type Sport = 'running' | 'trail running' | 'treadmill running' | 'cycling' | 'swimming' | 'strength' | 'other';

export type Lap = { distanceM: number; movingS: number; elapsedS: number };

export type Stone = {
  id: string;
  start: Date;
  /** The local date where it started, e.g. 2026-11-14. */
  localDate: string;
  sport: Sport;
  /** Strength keeps totals only: no distance, no laps. */
  distanceM: number | null;
  movingS: number;
  elapsedS: number;
  laps: Lap[];
  fileName: string;
};

export type UploadOutcome =
  | 'placed'
  | 'already placed'
  | 'not a session'
  | 'multisport'
  | 'broken'
  | 'too large'
  | 'not a FIT file';

export const uploadOutcomes: UploadOutcome[] = [
  'placed',
  'already placed',
  'not a session',
  'multisport',
  'broken',
  'too large',
  'not a FIT file',
];

export type UploadResult =
  | { kind: 'placed'; stone: Stone }
  | { kind: 'already placed'; stone: Stone }
  | { kind: 'turned away'; reason: Exclude<UploadOutcome, 'placed' | 'already placed'>; fileName: string };

function laps(count: number, lapM: number, secPerKm: number): Lap[] {
  return Array.from({ length: count }, (_, i) => {
    const wobble = ((i * 37) % 11) - 5;
    const movingS = Math.round((lapM / 1000) * (secPerKm + wobble));
    return { distanceM: lapM, movingS, elapsedS: movingS + (i % 3 === 0 ? 4 : 0) };
  });
}

function stone(id: string, iso: string, sport: Sport, lapList: Lap[], extra?: Partial<Stone>): Stone {
  const distanceM = lapList.reduce((sum, l) => sum + l.distanceM, 0);
  const movingS = lapList.reduce((sum, l) => sum + l.movingS, 0);
  const elapsedS = lapList.reduce((sum, l) => sum + l.elapsedS, 0);
  return {
    id,
    start: new Date(iso),
    localDate: iso.slice(0, 10),
    sport,
    distanceM,
    movingS,
    elapsedS,
    laps: lapList,
    fileName: `${iso.slice(0, 10).replaceAll('-', '')}_${id}.fit`,
    ...extra,
  };
}

export const someStones: Stone[] = [
  stone('s7', '2026-11-14T09:12:00', 'running', laps(16, 1000, 330)),
  stone('s6', '2026-11-13T17:40:00', 'strength', [], { distanceM: null, movingS: 2460, elapsedS: 2910 }),
  stone('s5', '2026-11-12T06:30:00', 'running', [...laps(1, 2000, 360), ...laps(6, 800, 250), ...laps(1, 2000, 370)]),
  stone('s4', '2026-11-11T12:05:00', 'swimming', laps(8, 200, 1050)),
  stone('s3', '2026-11-09T10:00:00', 'trail running', laps(14, 1000, 410), { elapsedS: 6400 }),
  stone('s2', '2026-11-08T08:15:00', 'cycling', laps(4, 10000, 110)),
  stone('s1', '2026-11-04T18:20:00', 'other', laps(1, 3400, 600)),
];

let nextId = 100;

function newStone(fileName: string): Stone {
  nextId += 1;
  return {
    ...stone(`n${nextId}`, '2026-11-15T07:45:00', 'treadmill running', laps(10, 1000, 315)),
    fileName,
  };
}

/** The whole prototype state: stones in memory, a stubbed upload and a stubbed delete. */
export function useFakeStones(start: 'empty' | 'stones', nextUpload: UploadOutcome) {
  const [stones, setStones] = useState<Stone[]>(() => (start === 'empty' ? [] : someStones));
  const [uploading, setUploading] = useState<string | null>(null);

  async function placeFromFile(fileName: string): Promise<UploadResult> {
    setUploading(fileName);
    await new Promise((r) => setTimeout(r, 1200));
    setUploading(null);
    if (nextUpload === 'placed') {
      const placed = newStone(fileName);
      setStones((s) => [placed, ...s]);
      return { kind: 'placed', stone: placed };
    }
    if (nextUpload === 'already placed') {
      const existing = stones[0] ?? someStones[0]!;
      if (stones.length === 0) setStones([existing]);
      return { kind: 'already placed', stone: existing };
    }
    return { kind: 'turned away', reason: nextUpload, fileName };
  }

  function deleteStone(id: string) {
    setStones((s) => s.filter((x) => x.id !== id));
  }

  function restoreStone(restored: Stone) {
    setStones((s) => [...s, restored].sort((a, b) => b.start.getTime() - a.start.getTime()));
  }

  return { stones, uploading, placeFromFile, deleteStone, restoreStone };
}

export type FakeStones = ReturnType<typeof useFakeStones>;

// --- Formatting -----------------------------------------------------------------------------

export function duration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return h ? `${h}:${mm}:${String(sec).padStart(2, '0')}` : `${mm}:${String(sec).padStart(2, '0')}`;
}

export function distance(m: number | null) {
  if (m === null) return '—';
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(2)} km`;
}

/** Pace for running, speed for cycling, per 100 m for swimming. */
export function paceOrSpeed(sport: Sport, m: number | null, movingS: number) {
  if (!m) return null;
  if (sport === 'cycling') return `${((m / movingS) * 3.6).toFixed(1)} km/h`;
  if (sport === 'swimming') return `${duration(Math.round((movingS / m) * 100))} /100 m`;
  if (sport === 'strength') return null;
  return `${duration(Math.round((movingS / m) * 1000))} /km`;
}

export function day(localDate: string, style: 'long' | 'short' = 'long') {
  const d = new Date(`${localDate}T12:00:00`);
  return d.toLocaleDateString('en-GB', {
    weekday: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
  });
}

export function time(d: Date) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export const sportEmoji: Record<Sport, string> = {
  running: '🏃',
  'trail running': '⛰️',
  'treadmill running': '🏃',
  cycling: '🚴',
  swimming: '🏊',
  strength: '🏋️',
  other: '✳️',
};

export const turnedAwayWhy: Record<Exclude<UploadOutcome, 'placed' | 'already placed'>, string> = {
  'not a session': "This file isn't a finished session (it looks like a course or a saved workout).",
  multisport: "Varða can't place multisport sessions (like a triathlon) yet.",
  broken: "This file is damaged or wasn't saved completely by the watch.",
  'too large': 'This file is over 25 MB.',
  'not a FIT file': "This isn't a FIT file. Use the .fit file from your watch.",
};
