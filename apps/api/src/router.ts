import { implement } from '@orpc/server';
import { contract } from '@varda/contract';
import { createRecordRouter } from '@varda/record';
import { createSharedReaders, createSharedRouter, type SharedContext } from '@varda/shared';
import type { AppAdapters } from './adapters.ts';

const os = implement(contract).$context<SharedContext>();

// Combines each context's part of the contract and wires in its adapters, and the readers one
// context publishes into the ports another reads them through (ADR 0006, ADR 0008).
export function createRouter(adapters: AppAdapters) {
  const shared = createSharedReaders(adapters.shared);
  return os.router({
    shared: createSharedRouter(adapters.shared),
    plan: {},
    record: createRecordRouter({ ...adapters.record, coachingAccess: shared.coachingAccess }),
  });
}
