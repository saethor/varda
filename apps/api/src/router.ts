import { implement } from '@orpc/server';
import { contract } from '@varda/contract';
import { createSharedRouter, type SharedContext } from '@varda/shared';
import type { AppAdapters } from './adapters.ts';

const os = implement(contract).$context<SharedContext>();

// Combines each context's part of the contract and wires in its adapters (ADR 0006, ADR 0008).
export function createRouter(adapters: AppAdapters) {
  return os.router({
    shared: createSharedRouter(adapters.shared),
    plan: {},
    record: {},
  });
}
