import { Trans } from '@lingui/react/macro';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet, useMatches, useRouter } from '@tanstack/react-router';
import { Button } from '@varda/ui/components/button';
import { cn } from '@varda/ui/lib/utils';
import { lazy, type ReactNode, Suspense } from 'react';
import wordmark from '../assets/varda-wordmark.svg';
import { SomethingWentWrongAlert } from '../components/form.tsx';

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /**
     * `wide` for the desktop screens that use the full width (DESIGN.md, Layout). Left out,
     * a screen is the one narrow column.
     */
    layout?: 'wide';
  }
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => (
    <Page>
      <Outlet />
    </Page>
  ),
  // Varða couldn't be reached or failed (not "nobody is signed in", which goes to sign-in).
  errorComponent: SomethingWentWrong,
});

// Only in Vite's dev mode; production builds drop the branch, and the module with it.
const DevMenu = import.meta.env.DEV
  ? lazy(async () => ({ default: (await import('../dev-menu/dev-menu.tsx')).DevMenu }))
  : null;

function Page({ children }: { children: ReactNode }) {
  const wide = useMatches({ select: (matches) => matches.some((match) => match.staticData.layout === 'wide') });

  return (
    <main className={cn('mx-auto flex flex-col gap-6 p-8', wide ? 'max-w-6xl' : 'max-w-md')}>
      <header>
        {/* The brand is a name, the same in every language: the drawn wordmark, never typed in a font. */}
        <img src={wordmark} alt="Varða" width={248.5} height={60} className="h-6 w-auto" />
        <p className="mt-2 text-sm text-muted-foreground">
          <Trans>One stone at a time.</Trans>
        </p>
      </header>
      {children}
      {DevMenu && (
        <Suspense fallback={null}>
          <DevMenu />
        </Suspense>
      )}
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
