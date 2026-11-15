import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@varda/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@varda/ui/components/card';
import { SomethingWentWrongAlert } from '../../components/form.tsx';
import { passkeysQuery } from '../../lib/passkeys.ts';
import { addPasskey, browserSupportsPasskeys, type Passkey } from '../../sign-in/sign-in.ts';

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
  const queryClient = useQueryClient();
  const adding = useMutation({
    mutationFn: addPasskey,
    onSuccess: async () => await queryClient.invalidateQueries(passkeysQuery),
  });

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
  const { i18n } = useLingui();
  const added = i18n.date(passkey.addedAt, { dateStyle: 'medium' });

  return (
    <li className="flex flex-col px-4 py-3">
      <span>{passkey.name ?? <Trans>Passkey</Trans>}</span>
      <span className="text-sm text-muted-foreground">
        <Trans>Added {added}</Trans>
      </span>
    </li>
  );
}
