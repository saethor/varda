import { Trans } from '@lingui/react/macro';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-8">
      <header>
        {/* The brand is a name, the same in every language. */}
        <p className="text-3xl tracking-widest">VARÐA</p>
        <p className="text-sm text-muted-foreground">
          <Trans>One stone at a time.</Trans>
        </p>
      </header>
      <Outlet />
    </main>
  ),
});
