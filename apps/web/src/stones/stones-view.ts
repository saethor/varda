import { z } from 'zod';

/**
 * The stones screen's search: `?view=calendar` shows the calendar, and `month` (`YYYY-MM`) the
 * month it shows. Left out, the screen is the feed, and the calendar shows this month. The URL is
 * what remembers the choice, so a reload or a shared link keeps it.
 */
export const stonesSearch = z.object({
  view: z.literal('calendar').optional().catch(undefined),
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional()
    .catch(undefined),
});

export type StonesSearch = z.infer<typeof stonesSearch>;
