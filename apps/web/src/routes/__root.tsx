import { Trans } from '@lingui/react/macro';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet, useRouter } from '@tanstack/react-router';
import { Button } from '@varda/ui/components/button';
import type { ReactNode } from 'react';
import { SomethingWentWrongAlert } from '../components/form.tsx';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => (
    <Page>
      <Outlet />
    </Page>
  ),
  // Varða couldn't be reached or failed (not "nobody is signed in", which goes to sign-in).
  errorComponent: SomethingWentWrong,
});

function Page({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-8">
      <header>
        {/* The brand is a name, the same in every language. */}
        <p className="text-3xl tracking-widest">VARÐA</p>
        <p className="text-sm text-muted-foreground">
          <Trans>One stone at a time.</Trans>
        </p>
      </header>
      {children}
    </main>
  );
}

function SomethingWentWrong() {
  const router = useRouter();

  return (
    <Page>
      <SomethingWentWrongAlert />
      <Button className="self-start" onClick={() => void router.invalidate()}>
        <Trans>Try again</Trans>
      </Button>
    </Page>
  );
}
