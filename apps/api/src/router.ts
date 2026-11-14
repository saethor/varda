import { implement } from '@orpc/server';
import { contract } from '@varda/contract';
import { listSports } from '@varda/shared';

const os = implement(contract);

export const router = os.router({
  shared: {
    sports: {
      list: os.shared.sports.list.handler(() => listSports()),
    },
  },
  plan: {},
  record: {},
});
