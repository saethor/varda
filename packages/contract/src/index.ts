// The whole API contract: each context's contract under its own key.
// Each context implements its part; apps/api combines them; apps/web calls it.
import { planContract } from '@varda/plan/contract';
import { recordContract } from '@varda/record/contract';
import { sharedContract } from '@varda/shared/contract';

export const contract = {
  shared: sharedContract,
  plan: planContract,
  record: recordContract,
};

export type Contract = typeof contract;
