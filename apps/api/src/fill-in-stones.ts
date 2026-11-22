// `pnpm db:fill-in-stones`: a one-off that re-reads every stone's recording with today's watch-file
// reader and keeps what it reads, so stones placed before the reader learned something hold it
// too (#82). Run it after `pnpm db:migrate` whenever the reader learns more; running it again
// changes nothing more. It names stones by their ID only, never with what they hold (spec #74).
import { createRecordAdapters, fillInStones } from '@varda/record';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { required } from './env.ts';
import { createUuidV7Ids } from './ids.ts';

const pool = new Pool({ connectionString: required('DATABASE_URL') });
try {
  const record = createRecordAdapters({
    db: drizzle({ client: pool }),
    ids: createUuidV7Ids(),
    recordingsDir: required('VARDA_RECORDINGS_DIR'),
  });
  const { filledIn, notFilledIn } = await fillInStones(record);
  for (const { stoneId, reason } of notFilledIn) console.error(`left stone ${stoneId} as it was: ${reason}`);
  console.log(`filled in ${filledIn.length} stones, left ${notFilledIn.length} as they were`);
  if (notFilledIn.length > 0) process.exitCode = 1;
} finally {
  await pool.end();
}
