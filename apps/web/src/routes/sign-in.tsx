import { Trans, useLingui } from '@lingui/react/macro';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Alert, AlertDescription } from '@varda/ui/components/alert';
import { Button } from '@varda/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@varda/ui/components/card';
import { FieldGroup } from '@varda/ui/components/field';
import { z } from 'zod';
import { linkClassName, SomethingWentWrongAlert, TextField } from '../components/form.tsx';
import { forgetWhoIsSignedIn, sendSignedInPersonHome } from '../lib/me.ts';
import { usePasswordSchema } from '../sign-in/password.ts';
import { safeRedirect } from '../sign-in/safe-redirect.ts';
import { EmailAndPasswordDontMatch, signIn } from '../sign-in/sign-in.ts';

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
            {signingIn.isError &&
              (signingIn.error instanceof EmailAndPasswordDontMatch ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    <Trans>That email and password don't match.</Trans>
                  </AlertDescription>
                </Alert>
              ) : (
                <SomethingWentWrongAlert />
              ))}
            <form.Field name="email">
              {(field) => <TextField field={field} label={<Trans>Email</Trans>} type="email" autoComplete="email" />}
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
