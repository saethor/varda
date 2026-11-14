import { implement } from '@orpc/server';
import { contract } from '@varda/contract';
import { createSharedRouter } from '@varda/shared';
import type { AppAdapters } from './adapters.ts';

const os = implement(contract);

// Combines each context's part of the contract and wires in its adapters (ADR 0006, ADR 0008).
export function createRouter(_adapters: AppAdapters) {
  return os.router({
    shared: createSharedRouter(),
    plan: {},
    record: {},
  });
}
