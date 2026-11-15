import { Trans, useLingui } from '@lingui/react/macro';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Alert, AlertDescription } from '@varda/ui/components/alert';
import { Badge } from '@varda/ui/components/badge';
import { Button } from '@varda/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@varda/ui/components/card';
import { FieldGroup } from '@varda/ui/components/field';
import { Separator } from '@varda/ui/components/separator';
import { type ReactNode, useEffect, useId, useReducer, useState } from 'react';
import { z } from 'zod';
import { linkClassName, SomethingWentWrongAlert, TextField } from '../components/form.tsx';
import { forgetEverythingCached, sendSignedInPersonHome } from '../lib/me.ts';
import { usePasswordSchema } from '../sign-in/password.ts';
import { type SafePath, safeRedirect } from '../sign-in/safe-redirect.ts';
import {
  browserSupportsPasskeys,
  EmailAndPasswordDontMatch,
  lastSignInMethod,
  offerPasskeysInAutofill,
  PasskeyNotRecognised,
  type PasskeyOutcome,
  signIn,
  signInWithPasskey,
} from '../sign-in/sign-in.ts';
import { nothingFailed, type SignInEvent, signInFailure } from '../sign-in/sign-in-failure.ts';

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

  const [failure, dispatch] = useReducer(signInFailure, nothingFailed);
  const signingIn = useMutation({
    mutationFn: signIn,
    onMutate: () => dispatch({ type: 'signInStarted' }),
    onError: (error) => dispatch({ type: 'signInFailed', error }),
    onSuccess: async () => {
      forgetEverythingCached(queryClient);
      await navigate({ href: goingTo });
    },
  });
  const withPasskey = usePasskeySignIn(goingTo, dispatch);
  // Read once as the screen opens: signing in here moves on to another screen anyway.
  const [lastUsed] = useState(lastSignInMethod);

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
            <SignInFailed error={failure.shown} />
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
            <LastUsed shown={lastUsed === 'password'}>
              {(badge) => (
                <form.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <Button type="submit" disabled={isSubmitting} aria-describedby={badge}>
                      <Trans>Sign in</Trans>
                    </Button>
                  )}
                </form.Subscribe>
              )}
            </LastUsed>
          </FieldGroup>
        </form>
        {browserSupportsPasskeys() && (
          <div className="mt-6 flex flex-col gap-6">
            <Separator />
            <LastUsed shown={lastUsed === 'passkey'}>
              {(badge) => (
                <Button
                  variant="secondary"
                  disabled={withPasskey.isPending}
                  onClick={() => withPasskey.mutate()}
                  aria-describedby={badge}
                >
                  <Trans>Sign in with a passkey</Trans>
                </Button>
              )}
            </LastUsed>
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
 * Marks the button of the sign-in method this browser used last with a "Last used" badge,
 * which also describes the button to screen readers. `children` gets the badge's id.
 */
function LastUsed({ shown, children }: { shown: boolean; children: (badge: string | undefined) => ReactNode }) {
  const badge = useId();
  if (!shown) return children(undefined);
  return (
    <div className="relative flex flex-col">
      {children(badge)}
      <Badge id={badge} variant="outline" className="absolute -top-2.5 right-2 bg-background">
        <Trans>Last used</Trans>
      </Badge>
    </div>
  );
}

/**
 * Signing in with a passkey, from the button or from the browser's autofill on the email
 * field, which is offered as soon as the screen opens. Closing the browser's prompt changes
 * nothing on screen; the autofill offer, which the button's prompt replaces, is made again.
 * Returns the button's mutation; what happens is told to `dispatch` to decide what fails.
 */
function usePasskeySignIn(goingTo: SafePath, dispatch: (event: SignInEvent) => void) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const signedInIfDone = async (outcome: PasskeyOutcome) => {
    switch (outcome) {
      case 'done':
        forgetEverythingCached(queryClient);
        await navigate({ href: goingTo });
        return;
      case 'closed':
        return;
    }
  };

  const { mutate: offerAutofill } = useMutation({
    mutationFn: async () => await offerPasskeysInAutofill(() => dispatch({ type: 'passkeyPickedFromAutofill' })),
    onMutate: () => dispatch({ type: 'autofillOffered' }),
    onError: (error) => dispatch({ type: 'autofillFailed', error }),
    onSuccess: signedInIfDone,
  });
  const withPasskey = useMutation({
    mutationFn: signInWithPasskey,
    onMutate: () => dispatch({ type: 'signInStarted' }),
    onError: (error) => dispatch({ type: 'signInFailed', error }),
    onSuccess: signedInIfDone,
    onSettled: (outcome) => {
      if (outcome !== 'done') offerAutofill();
    },
  });

  // Synchronises with the browser: its autofill offers passkeys while this screen is open.
  useEffect(() => {
    if (browserSupportsPasskeys()) offerAutofill();
  }, [offerAutofill]);

  return withPasskey;
}

function SignInFailed({ error }: { error: Error | null }) {
  if (!error) return null;
  const message = failureMessage(error);
  if (!message) return <SomethingWentWrongAlert />;
  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

/** What to tell the person about a failure they can do something about, or `null` for any other. */
function failureMessage(error: Error): ReactNode {
  if (error instanceof EmailAndPasswordDontMatch) return <Trans>That email and password don't match.</Trans>;
  if (error instanceof PasskeyNotRecognised) {
    return <Trans>Varða doesn't recognise that passkey. Sign in with your password instead.</Trans>;
  }
  return null;
}
