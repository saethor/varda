import { implement, ORPCError } from '@orpc/server';
import { type SharedContext, sportGroupOf } from '@varda/shared';
import { placeStone } from '../application/place-stone.ts';
import type { RecordAdapters } from '../application/record-adapters.ts';
import { maxWatchFileBytes, recordContract } from '../contract.ts';
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
function shown({ id, localDate, start, sport, fileName, distance, movingTime, elapsedTime, laps, trace }: Stone) {
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
    trace,
  };
}

// The Record context's part of the API contract (ADR 0006).
export function createRecordRouter(adapters: RecordAdapters) {
  return os.router({
    stones: {
      place: os.stones.place.use(requirePerson).handler(async ({ context, input: { file }, errors }) => {
        // apps/api's body limit stops far larger bodies before they are read; this is the exact rule.
        if (file.size > maxWatchFileBytes) throw errors.TURNED_AWAY({ data: { reason: 'too-large' } });
        const bytes = new Uint8Array(await file.arrayBuffer());
        const placing = await placeStone(adapters, context.person, { name: file.name, bytes });
        if ('alreadyPlaced' in placing) throw errors.ALREADY_PLACED({ data: { stoneId: placing.alreadyPlaced } });
        if ('turnedAway' in placing) throw errors.TURNED_AWAY({ data: { reason: placing.turnedAway } });
        return { stoneId: placing.placed };
      }),
      list: os.stones.list
        .use(requirePerson)
        .handler(async ({ context, input }) => (await adapters.stones.ofAthlete(context.person, input)).map(shown)),
      get: os.stones.get.use(requirePerson).handler(async ({ context, input: { stoneId }, errors }) => {
        const stone = await adapters.stones.byId(stoneId);
        // One the signed-in person can't see looks exactly like one that doesn't exist (spec #60).
        if (stone === null || !(await adapters.coachingAccess.canSee(context.person, stone.athlete))) {
          throw errors.NOT_FOUND();
        }
        return shown(stone);
      }),
    },
  });
}
