import { Trans, useLingui } from '@lingui/react/macro';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { Alert, AlertDescription } from '@varda/ui/components/alert';
import { Button } from '@varda/ui/components/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@varda/ui/components/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@varda/ui/components/field';
import { Input } from '@varda/ui/components/input';
import { z } from 'zod';
import { forgetWhoIsSignedIn, signedInPerson } from '../lib/me.ts';
import { usePasswordSchema } from '../sign-in/password.ts';
import { safeRedirect } from '../sign-in/safe-redirect.ts';
import { EmailAndPasswordDontMatch, signIn } from '../sign-in/sign-in.ts';

const signInSearch = z.object({
  // Where the person was going, kept only if it is a path within Varða; otherwise home.
  redirect: z.string().optional().catch(undefined).transform(safeRedirect),
});

export const Route = createFileRoute('/sign-in')({
  validateSearch: signInSearch,
  beforeLoad: async ({ context }) => {
    if (await signedInPerson(context.queryClient)) throw redirect({ to: '/' });
  },
  component: SignIn,
});

const linkClassName = 'font-medium text-primary underline underline-offset-4';

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
            {signingIn.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {signingIn.error instanceof EmailAndPasswordDontMatch ? (
                    <Trans>That email and password don't match.</Trans>
                  ) : (
                    <Trans>Something went wrong, try again.</Trans>
                  )}
                </AlertDescription>
              </Alert>
            )}
            <form.Field name="email">
              {(field) => {
                const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>
                      <Trans>Email</Trans>
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      autoComplete="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      aria-invalid={invalid}
                    />
                    {invalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
            <form.Field name="password">
              {(field) => {
                const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>
                      <Trans>Password</Trans>
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      autoComplete="current-password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      aria-invalid={invalid}
                    />
                    {invalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
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
