import { implement } from '@orpc/server';
import { contract } from '@varda/contract';
import { listSports } from '@varda/shared';
import type { AppAdapters } from './adapters.ts';

const os = implement(contract);

// The only place contexts are wired to their adapters (ADR 0008).
export function createRouter(_adapters: AppAdapters) {
  return os.router({
    shared: {
      sports: {
        list: os.shared.sports.list.handler(() => listSports()),
      },
    },
    plan: {},
    record: {},
  });
}
