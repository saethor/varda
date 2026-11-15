import { Trans } from '@lingui/react/macro';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@varda/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@varda/ui/components/card';
import { SomethingWentWrongAlert } from '../../components/form.tsx';
import { forgetEverythingCached, meQuery } from '../../lib/me.ts';
import { signOut } from '../../sign-in/sign-in.ts';

export const Route = createFileRoute('/_signed-in/')({
  component: Home,
});

function Home() {
  // The signed-in layout has already loaded who is signed in, so this never suspends.
  const { data: person } = useSuspenseQuery(meQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const signingOut = useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      // Forget first, or sign-in would still see this person and send them back here.
      forgetEverythingCached(queryClient);
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
        {signingOut.isError && <SomethingWentWrongAlert />}
        <Button variant="secondary" disabled={signingOut.isPending} onClick={() => signingOut.mutate()}>
          <Trans>Sign out</Trans>
        </Button>
      </CardContent>
    </Card>
  );
}
