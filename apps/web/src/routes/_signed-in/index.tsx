import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Alert, AlertDescription } from '@varda/ui/components/alert';
import { Button } from '@varda/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@varda/ui/components/card';
import { forgetWhoIsSignedIn, meQuery } from '../../lib/me.ts';
import { signOut } from '../../sign-in/sign-in.ts';

export const Route = createFileRoute('/_signed-in/')({
  component: Home,
});

function Home() {
  const { data: person } = useSuspenseQuery(meQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const signingOut = useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      await navigate({ to: '/sign-in' });
      forgetWhoIsSignedIn(queryClient);
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
