// The in-memory fakes held to the same behaviour suites as the real adapters (ADR 0008).
import { createInMemoryRecordings, createInMemoryStones, createSequentialIds } from './fakes.ts';
import { describeRecordings, describeStones } from './index.ts';

describeStones('in memory', async () => ({ stones: createInMemoryStones(), ids: createSequentialIds() }));

describeRecordings('in memory', async () => ({ recordings: createInMemoryRecordings(), ids: createSequentialIds() }));
