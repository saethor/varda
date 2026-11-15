import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Alert, AlertDescription } from '@varda/ui/components/alert';
import { Button } from '@varda/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@varda/ui/components/card';
import { forgetWhoIsSignedIn } from '../../lib/me.ts';
import { signOut } from '../../sign-in/sign-in.ts';

export const Route = createFileRoute('/_signed-in/')({
  component: Home,
});

function Home() {
  // The signed-in layout asked who is signed in; read from there, so forgetting it on
  // signing out doesn't ask again while this page is still showing.
  const { person } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const signingOut = useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      // Forget first, or sign-in would still see this person and send them back here.
      forgetWhoIsSignedIn(queryClient);
      await navigate({ to: '/sign-in' });
    },
  });
  const { name } = person;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl">
            <Trans>Hi, {name}</Trans>
          </h1>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        {signingOut.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              <Trans>Something went wrong, try again.</Trans>
            </AlertDescription>
          </Alert>
        )}
        <Button variant="secondary" disabled={signingOut.isPending} onClick={() => signingOut.mutate()}>
          <Trans>Sign out</Trans>
        </Button>
      </CardContent>
    </Card>
  );
}
