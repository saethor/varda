import { useLingui } from '@lingui/react/macro';
import { z } from 'zod';

/** Better Auth's default password length, checked in the forms before submitting. */
const passwordLength = { min: 8, max: 128 } as const;

/** A password of the length Better Auth accepts, with translated messages, for sign-up and sign-in. */
export function usePasswordSchema() {
  const { t } = useLingui();
  const { min, max } = passwordLength;
  return z
    .string()
    .min(min, t`Your password needs at least ${min} characters.`)
    .max(max, t`Your password can have at most ${max} characters.`);
}
