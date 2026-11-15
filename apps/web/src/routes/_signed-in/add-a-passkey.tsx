import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@varda/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@varda/ui/components/card';
import { SomethingWentWrongAlert } from '../../components/form.tsx';
import { passkeysQuery } from '../../lib/passkeys.ts';
import { addPasskey } from '../../sign-in/sign-in.ts';

// The one-time offer of a passkey. Only sign-up leads here, so it never comes back;
// Settings is where to add a passkey later.
export const Route = createFileRoute('/_signed-in/add-a-passkey')({
  component: AddAPasskey,
});

function AddAPasskey() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const goHome = async () => await navigate({ to: '/' });
  const adding = useMutation({
    mutationFn: addPasskey,
    onSuccess: async (outcome) => {
      // Closing the device's prompt leaves the person here to choose again.
      if (outcome === 'closed') return;
      await queryClient.invalidateQueries(passkeysQuery);
      await goHome();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl">
            <Trans>Add a passkey?</Trans>
          </h1>
        </CardTitle>
        <CardDescription>
          <Trans>
            Next time, sign in with your fingerprint, face or device PIN instead of your password. You can also add a
            passkey later in Settings.
          </Trans>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        {adding.isError && <SomethingWentWrongAlert />}
        <div className="flex gap-2">
          <Button disabled={adding.isPending} onClick={() => adding.mutate()}>
            <Trans>Add a passkey</Trans>
          </Button>
          <Button variant="secondary" disabled={adding.isPending} onClick={() => void goHome()}>
            <Trans>Not now</Trans>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
