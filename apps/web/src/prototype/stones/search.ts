// PROTOTYPE, throw me away. The search params the floating bar drives, shared by the feed and a stone's screen.

import { z } from 'zod';
import { type UploadOutcome, uploadOutcomes } from './fake.ts';

export const prototypeSearch = z.object({
  variant: z.enum(['A', 'B', 'C', 'D']).catch('D'),
  start: z.enum(['empty', 'stones']).catch('stones'),
  /** Variant D: the athlete toggles between the feed and the calendar. */
  view: z.enum(['feed', 'calendar']).catch('feed'),
  next: z.enum(uploadOutcomes as [UploadOutcome, ...UploadOutcome[]]).catch('placed'),
});

export type PrototypeSearch = z.infer<typeof prototypeSearch>;
