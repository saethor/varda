// The cairn mark's geometry (logo/final/README.md): stones 20 tall, 7 apart, corners of 4, and
// widths 52, 78, 100, 120, 140 from the capstone down.

export const stoneHeight = 20;
export const stoneGap = 7;
const markWidths = [52, 78, 100, 120, 140];

export interface CairnStone {
  x: number;
  y: number;
  width: number;
}

/**
 * A cairn of `count` stones, capstone first, in the mark's units. Up to five it is the mark's own top
 * stones; a busier week widens the base a step per stone, so the stack stays a cairn.
 */
export function cairnStones(count: number): CairnStone[] {
  const widths = Array.from({ length: count }, (_, i) => markWidths[i] ?? 140 + (i - 4) * 10);
  const widest = Math.max(...widths);
  return widths.map((width, i) => ({ x: (widest - width) / 2, y: i * (stoneHeight + stoneGap), width }));
}
