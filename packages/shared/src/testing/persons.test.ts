import { createInMemoryPersons, createSequentialIds, describePersons } from './index.ts';

let loginAccounts = 0;

describePersons('in memory', async () => ({
  persons: createInMemoryPersons(),
  ids: createSequentialIds(),
  newLoginAccount: () => `login-account-${++loginAccounts}`,
}));
