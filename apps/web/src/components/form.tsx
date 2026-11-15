import { Trans } from '@lingui/react/macro';
import type { AnyFieldApi } from '@tanstack/react-form';
import { Alert, AlertDescription } from '@varda/ui/components/alert';
import { Field, FieldError, FieldLabel } from '@varda/ui/components/field';
import { Input } from '@varda/ui/components/input';
import type { ReactNode } from 'react';

/** A link inside a sentence, such as "Already signed up? Sign in". */
export const linkClassName = 'font-medium text-primary underline underline-offset-4';

/**
 * A labelled text input for a TanStack Form field, showing the field's own error once
 * it has been touched. A problem the server found with the value (an email that is
 * already signed up) is passed as `children` and shown in place of the field's own error.
 */
export function TextField({
  field,
  label,
  type,
  autoComplete,
  children,
}: {
  field: AnyFieldApi;
  label: ReactNode;
  type: 'text' | 'email' | 'password';
  autoComplete: string;
  children?: ReactNode;
}) {
  const invalid = (field.state.meta.isTouched && !field.state.meta.isValid) || Boolean(children);
  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        type={type}
        autoComplete={autoComplete}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
        aria-invalid={invalid}
      />
      {children ? <FieldError>{children}</FieldError> : invalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

/** Varða couldn't be reached or failed, and trying again may help. */
export function SomethingWentWrongAlert() {
  return (
    <Alert variant="destructive">
      <AlertDescription>
        <Trans>Something went wrong, try again.</Trans>
      </AlertDescription>
    </Alert>
  );
}
