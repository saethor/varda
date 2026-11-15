import { queryOptions } from '@tanstack/react-query';
import { listPasskeys } from '../sign-in/sign-in.ts';

/** The passkeys on the signed-in person's login account. Invalidate it after adding or removing one. */
export const passkeysQuery = queryOptions({ queryKey: ['passkeys'], queryFn: listPasskeys });
