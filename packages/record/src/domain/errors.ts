// Record's expected failures, thrown by its domain and use cases and translated into the
// contract's typed errors in `adapters/rpc` (CODING_STANDARDS, ADR 0006).
import type { StoneId, TurnedAwayReason } from './stone.ts';

/** A watch file that can't be placed. Nothing of it is kept. */
export class WatchFileTurnedAway extends Error {
  readonly reason: TurnedAwayReason;

  constructor(reason: TurnedAwayReason) {
    super(`The watch file was turned away: ${reason}.`);
    this.name = 'WatchFileTurnedAway';
    this.reason = reason;
  }
}

/** The athlete already placed a stone from this session: that stone. */
export class SessionAlreadyPlaced extends Error {
  readonly stoneId: StoneId;

  constructor(stoneId: StoneId) {
    super(`A stone was already placed from this session: ${stoneId}.`);
    this.name = 'SessionAlreadyPlaced';
    this.stoneId = stoneId;
  }
}

/** There is no such stone, or not one the person asking may have: the two look the same. */
export class StoneNotFound extends Error {
  constructor(stoneId: StoneId) {
    super(`No stone ${stoneId} was found.`);
    this.name = 'StoneNotFound';
  }
}
