import { Trans, useLingui } from '@lingui/react/macro';
import { createFileRoute, Link, Outlet, redirect, useMatches } from '@tanstack/react-router';
import { cn } from '@varda/ui/lib/utils';
import wordmark from '../assets/varda-wordmark-dark.svg';
import { signedInPerson } from '../lib/me.ts';

// Every signed-in page sits under this pathless layout: nobody signed in is sent to sign in,
// and comes back here afterwards.
export const Route = createFileRoute('/_signed-in')({
  beforeLoad: async ({ context, location }) => {
    if (!(await signedInPerson(context.queryClient))) {
      throw redirect({ to: '/sign-in', search: { redirect: location.href } });
    }
  },
  component: SignedIn,
});

const navLinkClassName =
  'flex h-full items-center border-b-2 border-transparent px-1 text-sm text-shell-muted transition-colors hover:text-shell-foreground focus-visible:text-shell-foreground focus-visible:outline-none focus-visible:border-lichen data-[status=active]:border-lichen data-[status=active]:text-shell-foreground';

function SignedIn() {
  const { t } = useLingui();
  const wide = useMatches({ select: (matches) => matches.some((match) => match.staticData.layout === 'wide') });
  const width = wide ? 'max-w-6xl' : 'max-w-md';

  return (
    <>
      <header className="bg-shell text-shell-foreground">
        <div className={cn('mx-auto flex h-14 items-center gap-8 px-5 sm:px-8', width)}>
          <Link
            to="/"
            className="shrink-0 rounded-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lichen"
          >
            {/* The brand is a name, the same in every language: the drawn wordmark, never typed in a font. */}
            <img src={wordmark} alt="Varða" width={248.5} height={60} className="h-4 w-auto" />
          </Link>
          <nav aria-label={t`Main`} className="flex h-full gap-5">
            <Link to="/" className={navLinkClassName} activeOptions={{ exact: true }}>
              <Trans>Home</Trans>
            </Link>
            <Link to="/stones" className={navLinkClassName}>
              <Trans>Stones</Trans>
            </Link>
            <Link to="/settings" className={navLinkClassName}>
              <Trans>Settings</Trans>
            </Link>
          </nav>
        </div>
      </header>
      {/* A container the width of the window, so a part of a screen can grow out of the column to it (`fullBleed`). */}
      <div className="@container">
        <main className={cn('mx-auto flex flex-col gap-6 px-5 py-6 sm:p-8', width)}>
          <Outlet />
        </main>
      </div>
    </>
  );
}
