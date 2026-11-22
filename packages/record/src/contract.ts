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

/**
 * A stone as the web app sees it, in a list and opened. Times in seconds, distance in metres or
 * none (never 0).
 */
const StoneSchema = z.object({
  id: z.uuid(),
  /** The local date where the stone started, `YYYY-MM-DD`. */
  localDate: z.iso.date(),
  start: z.date(),
  /**
   * Seconds the local time where the stone started was ahead of UTC (negative when behind): its
   * start shifted by this is the time of day it was there. 0 when the watch file had no local time.
   */
  localOffset: z.number().int(),
  sport: SportSchema,
  /** The name of the watch file the stone was placed from. */
  fileName: z.string(),
  distance: z.number().nullable(),
  movingTime: z.number(),
  elapsedTime: z.number(),
  /** In order of their start; empty when the watch recorded none. */
  laps: z.array(LapSchema),
  /** The line the stone traced over the ground, `[lat, lon]` pairs in degrees, or none without GPS. */
  trace: z.array(z.tuple([z.number(), z.number()])).nullable(),
  /** How hard the stone felt, 1–10, from the rating the athlete gave on the watch; none without one. */
  effort: z.number().int().min(1).max(10).nullable(),
  /** The watch that recorded the stone, as people call it; its model is none when Varða doesn't know it. */
  device: z.object({ manufacturer: z.string(), model: z.string().nullable() }).nullable(),
});

/**
 * The athlete's measurements as their watch had them on the stone's day: weight in kilograms, height
 * in metres, resting and max heart rate in bpm. Each none when the watch had none.
 */
const MeasurementsSchema = z.object({
  weight: z.number().nullable(),
  height: z.number().nullable(),
  restingHeartRate: z.number().nullable(),
  maxHeartRate: z.number().nullable(),
});

/** A stone opened on its own screen: everything a listed stone has, and what only its screen shows. */
const StoneDetailSchema = StoneSchema.extend({
  /** None when the watch had none. A coach never sees weight or height: both are none for them. */
  measurements: MeasurementsSchema.nullable(),
});

/** The largest watch file a stone is placed from: 25 MB. The web app checks it before sending, too. */
export const maxWatchFileBytes = 25_000_000;

/** Why a watch file is turned away. */
const turnedAwayReasons = ['not-a-fit-file', 'too-large', 'broken', 'not-a-session', 'multisport'] as const;
export type TurnedAwayReason = (typeof turnedAwayReasons)[number];

export const recordContract = {
  stones: {
    /** Places a stone for the signed-in person from a watch file, keeping the file as its recording. */
    place: signedInProcedure
      .errors({
        /** The athlete already placed a stone from this session: that stone. */
        ALREADY_PLACED: { status: 409, data: z.object({ stoneId: z.uuid() }) },
        /** The file can't be placed, and nothing of it was kept. */
        TURNED_AWAY: { status: 422, data: z.object({ reason: z.enum(turnedAwayReasons) }) },
      })
      .input(z.object({ file: z.file() }))
      .output(z.object({ stoneId: z.uuid() })),
    /** The signed-in person's own stones whose local date is within `from`–`to` (inclusive), newest first. */
    list: signedInProcedure.input(z.object({ from: z.iso.date(), to: z.iso.date() })).output(z.array(StoneSchema)),
    /** The stone with its laps and trace. */
    get: signedInProcedure
      .errors({
        /** There is no such stone, or it is one the signed-in person can't see: the two look the same. */
        NOT_FOUND: { status: 404 },
      })
      .input(z.object({ stoneId: z.uuid() }))
      .output(StoneDetailSchema),
    /** Deletes the signed-in person's stone and its recording, so the same file can be placed again. */
    delete: signedInProcedure
      .errors({
        /** There is no such stone, or it is not the signed-in person's: the two look the same. */
        NOT_FOUND: { status: 404 },
      })
      .input(z.object({ stoneId: z.uuid() })),
  },
};
