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
import { EmailAlreadySignedUp, signUp } from '../sign-in/sign-in.ts';

export const Route = createFileRoute('/sign-up')({
  beforeLoad: async ({ context }) => {
    if (await signedInPerson(context.queryClient)) throw redirect({ to: '/' });
  },
  component: SignUp,
});

const linkClassName = 'font-medium text-primary underline underline-offset-4';

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
            {signingUp.isError && !emailAlreadySignedUp && (
              <Alert variant="destructive">
                <AlertDescription>
                  <Trans>Something went wrong, try again.</Trans>
                </AlertDescription>
              </Alert>
            )}
            <form.Field name="name">
              {(field) => {
                const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>
                      <Trans>Name</Trans>
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      autoComplete="name"
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
            <form.Field name="email" listeners={{ onChange: () => signingUp.reset() }}>
              {(field) => {
                const invalid = (field.state.meta.isTouched && !field.state.meta.isValid) || emailAlreadySignedUp;
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
                    {emailAlreadySignedUp ? (
                      <FieldError>
                        <Trans>
                          This email is already signed up.{' '}
                          <Link to="/sign-in" className={linkClassName}>
                            Sign in instead?
                          </Link>
                        </Trans>
                      </FieldError>
                    ) : (
                      invalid && <FieldError errors={field.state.meta.errors} />
                    )}
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
                      autoComplete="new-password"
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
