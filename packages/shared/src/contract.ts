import { oc } from '@orpc/contract';
import { z } from 'zod';
import { type Sport, sportGroups, sports } from './domain/sport.ts';

const SportSchema = z.object({
  sport: z.enum(sports as [Sport, ...Sport[]]),
  group: z.enum(sportGroups),
});

export const sharedContract = {
  sports: {
    list: oc.output(z.array(SportSchema)),
  },
};
