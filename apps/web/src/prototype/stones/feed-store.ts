// PROTOTYPE, throw me away. Variant D's stones live outside React, so they survive moving
// between the feed and a stone's own screen. Reset when the "start" in the bar changes.

import { useSyncExternalStore } from 'react';
import { type Stone, someStones, turnedAwayWhy, type UploadOutcome } from './fake.ts';

export type Notice =
  | { kind: 'placed'; stone: Stone }
  | { kind: 'already placed'; stone: Stone }
  | { kind: 'turned away'; fileName: string; why: string }
  | { kind: 'deleted'; stone: Stone };

type State = {
  start: 'empty' | 'stones' | null;
  stones: Stone[];
  uploading: string | null;
  notice: Notice | null;
};

let state: State = { start: null, stones: [], uploading: null, notice: null };
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

/** Starts the fake over when the bar's "start" changes; otherwise keeps what's there. */
export function startFeed(start: 'empty' | 'stones') {
  if (state.start !== start)
    state = { start, stones: start === 'empty' ? [] : someStones, uploading: null, notice: null };
}

export function useFeed() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

let nextId = 200;

/** Places a stone from the file, or says why not; the result is also left as the notice. */
export async function placeFromFile(fileName: string, outcome: UploadOutcome): Promise<Notice | null> {
  set({ uploading: fileName, notice: null });
  await new Promise((r) => setTimeout(r, 1200));
  if (outcome === 'placed') {
    nextId += 1;
    const template = someStones[0]!;
    const placed: Stone = {
      ...template,
      id: `d${nextId}`,
      start: new Date('2026-11-15T07:45:00'),
      localDate: '2026-11-15',
      sport: 'running',
      fileName,
    };
    set({ uploading: null, stones: [placed, ...state.stones], notice: { kind: 'placed', stone: placed } });
  } else if (outcome === 'already placed') {
    const existing = state.stones[0] ?? someStones[0]!;
    set({
      uploading: null,
      stones: state.stones.length ? state.stones : [existing],
      notice: { kind: 'already placed', stone: existing },
    });
  } else {
    set({ uploading: null, notice: { kind: 'turned away', fileName, why: turnedAwayWhy[outcome] } });
  }
  return state.notice;
}

export function deleteStone(stone: Stone) {
  set({ stones: state.stones.filter((s) => s.id !== stone.id), notice: { kind: 'deleted', stone } });
}

export function dismissNotice() {
  set({ notice: null });
}
