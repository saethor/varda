import type { Stone } from '../lib/stones.ts';

export type Dye = 'running' | 'strength' | 'cross-training' | 'other';

/** The yarn a stone is dyed in: its sport group, with "other" in undyed grey. */
export function dyeOf(sport: Stone['sport']): Dye {
  return sport.sport === 'other' ? 'other' : sport.group;
}

/** Fill, text and border classes per dye, written out so Tailwind finds them. */
export const dyeFill: Record<Dye, string> = {
  running: 'bg-dye-running',
  strength: 'bg-dye-strength',
  'cross-training': 'bg-dye-cross-training',
  other: 'bg-dye-other',
};

export const dyeBorder: Record<Dye, string> = {
  running: 'border-dye-running',
  strength: 'border-dye-strength',
  'cross-training': 'border-dye-cross-training',
  other: 'border-dye-other',
};
