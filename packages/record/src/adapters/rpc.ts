import { implement, ORPCError } from '@orpc/server';
import { type SharedContext, sportGroupOf } from '@varda/shared';
import { deleteStone } from '../application/delete-stone.ts';
import { openStone } from '../application/open-stone.ts';
import { placeStone } from '../application/place-stone.ts';
import type { RecordAdapters } from '../application/record-adapters.ts';
import { maxWatchFileBytes, recordContract } from '../contract.ts';
import { SessionAlreadyPlaced, StoneNotFound, WatchFileTurnedAway } from '../domain/errors.ts';
import type { PersonId, Stone } from '../domain/stone.ts';

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

/** A stone as the contract lists it. */
function toListedStone({
  id,
  localDate,
  start,
  localOffset,
  sport,
  fileName,
  distance,
  movingTime,
  elapsedTime,
  laps,
  trace,
}: Stone) {
  return {
    id,
    localDate,
    start,
    localOffset,
    sport: { sport, group: sportGroupOf(sport) },
    fileName,
    distance,
    movingTime,
    elapsedTime,
    laps,
    trace,
  };
}

/** A stone as the contract shows it opened, to `viewer`: its athlete, or someone coaching them. */
// biome-ignore lint/correctness/noUnusedFunctionParameters: measurements (#78) leave out what a coach mustn't see.
function toStoneDetail(stone: Stone, viewer: PersonId) {
  return {
    ...toListedStone(stone),
    stretches: stone.stretches,
  };
}

// The Record context's part of the API contract (ADR 0006). Each procedure translates the domain
// errors its use case throws into the typed errors its contract declares; anything else is a 500.
export function createRecordRouter(adapters: RecordAdapters) {
  return os.router({
    stones: {
      place: os.stones.place.use(requirePerson).handler(async ({ context, input: { file }, errors }) => {
        // apps/api's body limit stops far larger bodies before they are read; this is the exact rule.
        if (file.size > maxWatchFileBytes) throw errors.TURNED_AWAY({ data: { reason: 'too-large' } });
        const bytes = new Uint8Array(await file.arrayBuffer());
        try {
          return { stoneId: await placeStone(adapters, context.person, { name: file.name, bytes }) };
        } catch (error) {
          if (error instanceof SessionAlreadyPlaced) throw errors.ALREADY_PLACED({ data: { stoneId: error.stoneId } });
          if (error instanceof WatchFileTurnedAway) throw errors.TURNED_AWAY({ data: { reason: error.reason } });
          throw error;
        }
      }),
      list: os.stones.list
        .use(requirePerson)
        .handler(async ({ context, input }) =>
          (await adapters.stones.ofAthlete(context.person, input)).map(toListedStone),
        ),
      get: os.stones.get.use(requirePerson).handler(async ({ context, input: { stoneId }, errors }) => {
        try {
          return toStoneDetail(await openStone(adapters, context.person, stoneId), context.person);
        } catch (error) {
          if (error instanceof StoneNotFound) throw errors.NOT_FOUND();
          throw error;
        }
      }),
      delete: os.stones.delete.use(requirePerson).handler(async ({ context, input: { stoneId }, errors }) => {
        try {
          const { recordingLeftBehind } = await deleteStone(adapters, context.person, stoneId);
          if (recordingLeftBehind !== null) {
            console.error(
              `Removing the recording of deleted stone ${stoneId} failed; the file is left behind.`,
              recordingLeftBehind,
            );
          }
        } catch (error) {
          if (error instanceof StoneNotFound) throw errors.NOT_FOUND();
          throw error;
        }
      }),
    },
  });
}

/** Room over the largest watch file for the rest of a multipart body (boundaries, part headers, the JSON). */
const multipartHeadroom = 64 * 1024;

/**
 * The limit on a `place` request's body, for the HTTP server in front of the router: oRPC reads a
 * whole multipart body before the procedure runs, so a body far over the limit should be stopped
 * there, unread, and answered with `tooLarge()`, the procedure's own defined `TURNED_AWAY` error.
 */
export const placeBodyLimit = {
  /** The procedure's path under the router: `record.stones.place`. */
  path: ['stones', 'place'],
  maxBytes: maxWatchFileBytes + multipartHeadroom,
  tooLarge(): Response {
    const error = new ORPCError('TURNED_AWAY', { defined: true, status: 413, data: { reason: 'too-large' } });
    // oRPC's RPC wire format for an error, so the client sees the contract's TURNED_AWAY.
    return Response.json({ json: error.toJSON() }, { status: 413 });
  },
} as const;
