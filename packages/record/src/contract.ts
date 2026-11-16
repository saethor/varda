import { SportSchema, signedInProcedure } from '@varda/shared/contract';
import { z } from 'zod';

const lapTriggers = ['manual', 'distance', 'time', 'other'] as const;

/** A recorded section of a stone. Times in seconds, distance in metres or none. */
const LapSchema = z.object({
  start: z.date(),
  elapsedTime: z.number(),
  movingTime: z.number(),
  distance: z.number().nullable(),
  trigger: z.enum(lapTriggers),
});

/** A stone as the web app sees it. Times in seconds, distance in metres or none (never 0). */
const StoneSchema = z.object({
  id: z.uuid(),
  /** The local date where the stone started, `YYYY-MM-DD`. */
  localDate: z.iso.date(),
  start: z.date(),
  sport: SportSchema,
  /** The name of the watch file the stone was placed from. */
  fileName: z.string(),
  distance: z.number().nullable(),
  movingTime: z.number(),
  elapsedTime: z.number(),
  /** In order of their start; empty when the watch recorded none. */
  laps: z.array(LapSchema),
});

export const recordContract = {
  stones: {
    /** Places a stone for the signed-in person from a watch file, keeping the file as its recording. */
    place: signedInProcedure
      .errors({
        /** This session was placed before: the athlete's stone from it. */
        ALREADY_PLACED: { message: 'This session was placed before.', data: z.object({ stoneId: z.uuid() }) },
      })
      .input(z.object({ file: z.file() }))
      .output(z.object({ stoneId: z.uuid() })),
    /** The signed-in person's own stones whose local date is within `from`–`to` (inclusive), newest first. */
    list: signedInProcedure.input(z.object({ from: z.iso.date(), to: z.iso.date() })).output(z.array(StoneSchema)),
  },
};
