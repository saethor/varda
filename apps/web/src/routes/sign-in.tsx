import { Trans, useLingui } from '@lingui/react/macro';
import { useForm } from '@tanstack/react-form';
import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Alert, AlertDescription } from '@varda/ui/components/alert';
import { Button } from '@varda/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@varda/ui/components/card';
import { FieldGroup } from '@varda/ui/components/field';
import { Separator } from '@varda/ui/components/separator';
import { useEffect } from 'react';
import { z } from 'zod';
import { linkClassName, SomethingWentWrongAlert, TextField } from '../components/form.tsx';
import { forgetWhoIsSignedIn, sendSignedInPersonHome } from '../lib/me.ts';
import { usePasswordSchema } from '../sign-in/password.ts';
import { type SafePath, safeRedirect } from '../sign-in/safe-redirect.ts';
import {
  browserSupportsPasskeys,
  EmailAndPasswordDontMatch,
  offerPasskeysInAutofill,
  PasskeyNotRecognised,
  type PasskeyOutcome,
  signIn,
  signInWithPasskey,
} from '../sign-in/sign-in.ts';

const signInSearch = z.object({
  // Where the person was going, kept only if it is a path within Varða; otherwise home.
  redirect: z.string().optional().catch(undefined).transform(safeRedirect),
});

export const Route = createFileRoute('/sign-in')({
  validateSearch: signInSearch,
  beforeLoad: sendSignedInPersonHome,
  component: SignIn,
});

function SignIn() {
  const { t } = useLingui();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { redirect: goingTo } = Route.useSearch();

  const signingIn = useMutation({
    mutationFn: signIn,
    onSuccess: async () => {
      forgetWhoIsSignedIn(queryClient);
      await navigate({ href: goingTo });
    },
  });
  const { withPasskey, withAutofill } = usePasskeySignIn(goingTo);

  const password = usePasswordSchema();
  const schema = z.object({
    email: z.email(t`Enter a valid email address.`),
    password,
  });

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      // A failure is shown from the mutation's error, so nothing more to do with it here.
      await signingIn.mutateAsync(value).catch(() => undefined);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl">
            <Trans>Sign in</Trans>
          </h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <SignInFailed error={latestError([signingIn, withPasskey, withAutofill])} />
            <form.Field name="email">
              {(field) => (
                // `webauthn` offers the person's passkeys in the browser's autofill on this field.
                <TextField field={field} label={<Trans>Email</Trans>} type="email" autoComplete="email webauthn" />
              )}
            </form.Field>
            <form.Field name="password">
              {(field) => (
                <TextField
                  field={field}
                  label={<Trans>Password</Trans>}
                  type="password"
                  autoComplete="current-password"
                />
              )}
            </form.Field>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  <Trans>Sign in</Trans>
                </Button>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
        {browserSupportsPasskeys() && (
          <div className="mt-6 flex flex-col gap-6">
            <Separator />
            <Button variant="secondary" disabled={withPasskey.isPending} onClick={() => withPasskey.mutate()}>
              <Trans>Sign in with a passkey</Trans>
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-sm">
          <Trans>
            New to Varða?{' '}
            <Link to="/sign-up" className={linkClassName}>
              Sign up
            </Link>
          </Trans>
        </p>
      </CardFooter>
    </Card>
  );
}

/**
 * Signing in with a passkey, from the button or from the browser's autofill on the email
 * field, which is offered as soon as the screen opens. Closing the browser's prompt changes
 * nothing on screen; the autofill offer, which the button's prompt replaces, is made again.
 */
function usePasskeySignIn(goingTo: SafePath) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const signedInIfDone = async (outcome: PasskeyOutcome) => {
    switch (outcome) {
      case 'done':
        forgetWhoIsSignedIn(queryClient);
        await navigate({ href: goingTo });
        return;
      case 'closed':
        return;
    }
  };

  const withAutofill = useMutation({ mutationFn: offerPasskeysInAutofill, onSuccess: signedInIfDone });
  const { mutate: offerAutofill } = withAutofill;
  const withPasskey = useMutation({
    mutationFn: signInWithPasskey,
    onSuccess: signedInIfDone,
    onSettled: (outcome) => {
      if (outcome !== 'done') offerAutofill();
    },
  });

  // Synchronises with the browser: its autofill offers passkeys while this screen is open.
  useEffect(() => {
    if (browserSupportsPasskeys()) offerAutofill();
  }, [offerAutofill]);

  return { withPasskey, withAutofill };
}

type AnyMutation = Pick<UseMutationResult<unknown, Error, never>, 'error' | 'submittedAt'>;

/** The error of whichever way of signing in was tried last, if it failed. */
function latestError(mutations: AnyMutation[]): Error | null {
  const latest = mutations.reduce((a, b) => (b.submittedAt > a.submittedAt ? b : a));
  return latest.error;
}

function SignInFailed({ error }: { error: Error | null }) {
  if (!error) return null;
  if (error instanceof EmailAndPasswordDontMatch) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          <Trans>That email and password don't match.</Trans>
        </AlertDescription>
      </Alert>
    );
  }
  if (error instanceof PasskeyNotRecognised) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          <Trans>Varða doesn't recognise that passkey. Sign in with your password instead.</Trans>
        </AlertDescription>
      </Alert>
    );
  }
  return <SomethingWentWrongAlert />;
}
