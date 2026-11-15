import { Trans, useLingui } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@varda/ui/components/alert-dialog';
import { Button } from '@varda/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@varda/ui/components/card';
import { SomethingWentWrongAlert } from '../../components/form.tsx';
import { passkeysQuery, useAddPasskey, usePasskeyRemoval } from '../../lib/passkeys.ts';
import { browserSupportsPasskeys, type Passkey } from '../../sign-in/sign-in.ts';

export const Route = createFileRoute('/_signed-in/settings')({
  loader: async ({ context }) => await context.queryClient.ensureQueryData(passkeysQuery),
  component: Settings,
});

function Settings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl">
            <Trans>Settings</Trans>
          </h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SignInMethods />
      </CardContent>
    </Card>
  );
}

/** The ways the person can sign in: their password, which can't be removed, and each passkey. */
function SignInMethods() {
  const { data: passkeys } = useSuspenseQuery(passkeysQuery);
  // The new passkey shows up in the list; there is nothing more to do.
  const adding = useAddPasskey(null);

  return (
    <section aria-labelledby="sign-in-methods" className="flex flex-col items-start gap-4">
      <h2 id="sign-in-methods" className="text-lg font-semibold">
        <Trans>Sign-in methods</Trans>
      </h2>
      {adding.isError && <SomethingWentWrongAlert />}
      <ul className="flex w-full flex-col divide-y rounded-md border">
        <li className="px-4 py-3">
          <Trans>Password</Trans>
        </li>
        {passkeys.map((passkey) => (
          <PasskeyItem key={passkey.id} passkey={passkey} />
        ))}
      </ul>
      {browserSupportsPasskeys() && (
        <Button variant="secondary" disabled={adding.isPending} onClick={() => adding.mutate()}>
          <Trans>Add a passkey</Trans>
        </Button>
      )}
    </section>
  );
}

function PasskeyItem({ passkey }: { passkey: Passkey }) {
  const { i18n, t } = useLingui();
  const added = i18n.date(passkey.addedAt, { dateStyle: 'medium' });
  const name = passkey.name ?? t`Passkey`;
  const removing = usePasskeyRemoval(passkey.id);

  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex flex-col">
        <span>{name}</span>
        <span className="text-sm text-muted-foreground">
          <Trans>Added {added}</Trans>
        </span>
        {removing.isError && <SomethingWentWrongAlert />}
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={removing.isPending} aria-label={t`Remove ${name}`}>
            <Trans>Remove</Trans>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Trans>Remove {name}?</Trans>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Trans>This passkey will no longer sign you in to Varða. You can still sign in with your password.</Trans>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Trans>Cancel</Trans>
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => removing.mutate()}>
              <Trans>Remove</Trans>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
