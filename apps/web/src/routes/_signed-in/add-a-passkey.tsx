import { Trans } from '@lingui/react/macro';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { Button } from '@varda/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@varda/ui/components/card';
import { SomethingWentWrongAlert } from '../../components/form.tsx';
import { useAddPasskey } from '../../lib/passkeys.ts';
import { browserSupportsPasskeys } from '../../sign-in/sign-in.ts';

// The one-time offer of a passkey. Only sign-up leads here, so it never comes back;
// Settings is where to add a passkey later.
export const Route = createFileRoute('/_signed-in/add-a-passkey')({
  // Sign-up only comes here when the browser can make a passkey, but the address can
  // still be opened directly; a browser that can't make one has nothing to offer.
  beforeLoad: () => {
    if (!browserSupportsPasskeys()) throw redirect({ to: '/' });
  },
  component: AddAPasskey,
});

function AddAPasskey() {
  const navigate = useNavigate();
  const goHome = async () => await navigate({ to: '/' });
  // Closing the device's prompt leaves the person here to choose again.
  const adding = useAddPasskey(goHome);

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
          {/* Nothing waits on going home: a click handler has nobody to hand the promise to,
              and the router shows a failure to load home on its own. */}
          <Button variant="secondary" disabled={adding.isPending} onClick={() => void goHome()}>
            <Trans>Not now</Trans>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
