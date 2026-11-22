import { SportSchema, signedInProcedure } from '@varda/shared/contract';
import { z } from 'zod';

const lapTriggers = ['manual', 'distance', 'time', 'other'] as const;

/**
 * The watch's own figures, as recorded; each null when it recorded none (never 0). Heart rate in
 * bpm, ascent and descent in metres, power in W, temperature in °C, calories in kcal. Cadence as
 * the watch shows it: steps a minute for running, walking and hiking, rpm otherwise.
 */
const FiguresSchema = z.object({
  averageHeartRate: z.number().nullable(),
  maxHeartRate: z.number().nullable(),
  ascent: z.number().nullable(),
  descent: z.number().nullable(),
  averageCadence: z.number().nullable(),
  maxCadence: z.number().nullable(),
  averagePower: z.number().nullable(),
  maxPower: z.number().nullable(),
  normalizedPower: z.number().nullable(),
  minTemperature: z.number().nullable(),
  averageTemperature: z.number().nullable(),
  maxTemperature: z.number().nullable(),
  calories: z.number().nullable(),
});

/**
 * Running form, the watch's averages as recorded: step length and vertical oscillation in metres,
 * vertical ratio in percent, ground contact time in seconds; each none when not recorded.
 */
const FormSchema = z.object({
  stepLength: z.number().nullable(),
  verticalOscillation: z.number().nullable(),
  verticalRatio: z.number().nullable(),
  groundContactTime: z.number().nullable(),
});

const lapIntensities = ['warm-up', 'active', 'recovery', 'rest', 'cool-down'] as const;

/** A recorded section of a stone. Times in seconds, distance in metres or none. */
const LapSchema = z.object({
  start: z.date(),
  elapsedTime: z.number(),
  movingTime: z.number(),
  distance: z.number().nullable(),
  trigger: z.enum(lapTriggers),
  /** The watch's own figures for the lap, as recorded. */
  figures: FiguresSchema,
  /** What part of the stone the lap was (`active` is the work); none when the watch didn't mark it. */
  intensity: z.enum(lapIntensities).nullable(),
  /** Running only: the lap's form averages; none for other sports or when the watch recorded none. */
  form: FormSchema.nullable(),
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
  /** The watch's summary figures for the whole stone. */
  figures: FiguresSchema,
  /** Running only: the stone's form averages; none for other sports or when the watch recorded none. */
  form: FormSchema.nullable(),
});

const stretchKinds = ['running', 'walking', 'standing'] as const;

/** A part of a run spent running, walking or standing, as the watch detected it. Seconds of timer, metres or none. */
const StretchSchema = z.object({
  kind: z.enum(stretchKinds),
  start: z.date(),
  movingTime: z.number(),
  distance: z.number().nullable(),
});

/** All stretches of one kind, as the watch summed them. */
const StretchTotalSchema = z.object({ movingTime: z.number(), distance: z.number().nullable() });

/** A run's stretches in order of their start, and a total per kind (none for a kind the watch didn't detect). */
const StretchesSchema = z.object({
  inOrder: z.array(StretchSchema),
  totals: z.object({
    running: StretchTotalSchema.nullable(),
    walking: StretchTotalSchema.nullable(),
    standing: StretchTotalSchema.nullable(),
  }),
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

/** One value per point of the streams, `null` where the watch missed one; `null` when never recorded. */
const StreamChannelSchema = z.array(z.number().nullable()).nullable();

/**
 * Every point the watch recorded over the stone, as recorded (about one a second), as parallel
 * arrays. A distance correction will scale `distance` and `speed` on top of these, never in them.
 */
const StreamsSchema = z.object({
  /** Seconds from the stone's start, rising. */
  offset: z.array(z.number()),
  /** Whether the timer ran from the previous point up to this one: `false` ends a pause. */
  timerRunning: z.array(z.boolean()),
  /** Metres from the start. */
  distance: StreamChannelSchema,
  /** Metres per second. */
  speed: StreamChannelSchema,
  /** Beats per minute. */
  heartRate: StreamChannelSchema,
  /** Metres above sea level. */
  altitude: StreamChannelSchema,
  /** Watts. */
  power: StreamChannelSchema,
  /** Steps per minute on foot (running, walking, hiking), as the watch shows it; revolutions per minute otherwise. */
  cadence: StreamChannelSchema,
  /** Degrees Celsius. */
  temperature: StreamChannelSchema,
  /** `[lat, lon]` in degrees. */
  position: z.array(z.tuple([z.number(), z.number()]).nullable()).nullable(),
  /** Metres. */
  stepLength: StreamChannelSchema,
  /** Metres. */
  verticalOscillation: StreamChannelSchema,
  /** Percent. */
  verticalRatio: StreamChannelSchema,
  /** Seconds. */
  groundContactTime: StreamChannelSchema,
});

/**
 * A whole kilometre of the stone, or the remainder after the last one, worked out by Varða from its
 * streams: metres, seconds of moving time (pauses left out), average heart rate in bpm, ascent and
 * descent in metres; each of the last three none when the watch didn't record it.
 */
const SplitSchema = z.object({
  distance: z.number(),
  movingTime: z.number(),
  averageHeartRate: z.number().nullable(),
  ascent: z.number().nullable(),
  descent: z.number().nullable(),
});

/** A stone opened on its own screen: everything a listed stone has, and what only its screen shows. */
const StoneDetailSchema = StoneSchema.extend({
  /** A run's stretches and the watch's totals for each kind; none for other sports or when none were detected. */
  stretches: StretchesSchema.nullable(),
  /** None when the watch had none. A coach never sees weight or height: both are none for them. */
  measurements: MeasurementsSchema.nullable(),
  /** None when the watch recorded no points. Never listed. */
  streams: StreamsSchema.nullable(),
  /** Each whole kilometre in order, then the remainder; empty without distance, or for a swim. Never listed. */
  splits: z.array(SplitSchema),
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
