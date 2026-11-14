import { oc } from '@orpc/contract';
import { z } from 'zod';
import { type Sport, sportGroups, sports } from './domain/sport.ts';

const SportSchema = z.object({
  sport: z.enum(sports as [Sport, ...Sport[]]),
  group: z.enum(sportGroups),
});

const PersonSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

/**
 * The base for every procedure that requires a signed-in person, in any context.
 * Without one it fails with `UNAUTHORIZED`, so the web app can send them to sign in.
 */
export const signedInProcedure = oc.errors({
  UNAUTHORIZED: { message: 'Sign in to continue.' },
});

export const sharedContract = {
  sports: {
    list: oc.output(z.array(SportSchema)),
  },
  persons: {
    /** Who the signed-in person is. */
    me: signedInProcedure.output(PersonSchema),
  },
};
