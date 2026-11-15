import { Trans, useLingui } from '@lingui/react/macro';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@varda/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@varda/ui/components/card';
import { FieldGroup } from '@varda/ui/components/field';
import { z } from 'zod';
import { linkClassName, SomethingWentWrongAlert, TextField } from '../components/form.tsx';
import { forgetWhoIsSignedIn, sendSignedInPersonHome } from '../lib/me.ts';
import { usePasswordSchema } from '../sign-in/password.ts';
import { EmailAlreadySignedUp, signUp } from '../sign-in/sign-in.ts';

export const Route = createFileRoute('/sign-up')({
  beforeLoad: sendSignedInPersonHome,
  component: SignUp,
});

function SignUp() {
  const { t } = useLingui();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const signingUp = useMutation({
    mutationFn: signUp,
    onSuccess: async () => {
      forgetWhoIsSignedIn(queryClient);
      await navigate({ to: '/' });
    },
  });

  const password = usePasswordSchema();
  const schema = z.object({
    name: z.string().trim().min(1, t`Enter your name.`),
    email: z.email(t`Enter a valid email address.`),
    password,
  });

  const form = useForm({
    defaultValues: { name: '', email: '', password: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      // A failure is shown from the mutation's error, so nothing more to do with it here.
      await signingUp.mutateAsync({ ...value, name: value.name.trim() }).catch(() => undefined);
    },
  });

  const emailAlreadySignedUp = signingUp.error instanceof EmailAlreadySignedUp;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl">
            <Trans>Sign up</Trans>
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
            {signingUp.isError && !emailAlreadySignedUp && <SomethingWentWrongAlert />}
            <form.Field name="name">
              {(field) => <TextField field={field} label={<Trans>Name</Trans>} type="text" autoComplete="name" />}
            </form.Field>
            <form.Field name="email" listeners={{ onChange: () => signingUp.reset() }}>
              {(field) => (
                <TextField field={field} label={<Trans>Email</Trans>} type="email" autoComplete="email">
                  {emailAlreadySignedUp && (
                    <Trans>
                      This email is already signed up.{' '}
                      <Link to="/sign-in" className={linkClassName}>
                        Sign in instead?
                      </Link>
                    </Trans>
                  )}
                </TextField>
              )}
            </form.Field>
            <form.Field name="password">
              {(field) => (
                <TextField field={field} label={<Trans>Password</Trans>} type="password" autoComplete="new-password" />
              )}
            </form.Field>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  <Trans>Sign up</Trans>
                </Button>
              )}
            </form.Subscribe>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm">
          <Trans>
            Already signed up?{' '}
            <Link to="/sign-in" className={linkClassName}>
              Sign in
            </Link>
          </Trans>
        </p>
      </CardFooter>
    </Card>
  );
}
