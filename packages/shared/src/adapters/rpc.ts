import { implement } from '@orpc/server';
import { sharedContract } from '../contract.ts';
import { sportGroupOf, sports } from '../domain/sport.ts';

const os = implement(sharedContract);

// The Shared context's part of the API contract (ADR 0006). Takes no adapters
// yet because Shared has no ports; they arrive with auth and coaching access.
export function createSharedRouter() {
  return os.router({
    sports: {
      list: os.sports.list.handler(() => sports.map((sport) => ({ sport, group: sportGroupOf(sport) }))),
    },
  });
}
