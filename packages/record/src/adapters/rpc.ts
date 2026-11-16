import { implement, ORPCError } from '@orpc/server';
import { type SharedContext, sportGroupOf } from '@varda/shared';
import { placeStone } from '../application/place-stone.ts';
import type { RecordAdapters } from '../application/record-adapters.ts';
import { recordContract } from '../contract.ts';
import type { Stone } from '../domain/stone.ts';

const os = implement(recordContract).$context<SharedContext>();

/**
 * Requires a signed-in person and hands procedures their ID. Fails with the
 * `UNAUTHORIZED` error every procedure built on `signedInProcedure` declares.
 */
const requirePerson = os.middleware(async ({ context, next }) => {
  if (context.person === null) {
    throw new ORPCError('UNAUTHORIZED');
  }
  return await next({ context: { person: context.person } });
});

/** A stone as the contract shows it. */
function shown({ id, localDate, start, sport, fileName, distance, movingTime, elapsedTime, laps }: Stone) {
  return {
    id,
    localDate,
    start,
    sport: { sport, group: sportGroupOf(sport) },
    fileName,
    distance,
    movingTime,
    elapsedTime,
    laps,
  };
}

// The Record context's part of the API contract (ADR 0006).
export function createRecordRouter(adapters: RecordAdapters) {
  return os.router({
    stones: {
      place: os.stones.place.use(requirePerson).handler(async ({ context, input: { file }, errors }) => {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const placing = await placeStone(adapters, context.person, { name: file.name, bytes });
        if ('alreadyPlaced' in placing) throw errors.ALREADY_PLACED({ data: { stoneId: placing.alreadyPlaced } });
        return { stoneId: placing.placed };
      }),
      list: os.stones.list
        .use(requirePerson)
        .handler(async ({ context, input }) => (await adapters.stones.ofAthlete(context.person, input)).map(shown)),
    },
  });
}
