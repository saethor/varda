import { Trans, useLingui } from '@lingui/react/macro';
import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router';
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

const navLinkClassName = 'text-sm text-muted-foreground hover:text-foreground data-[status=active]:text-foreground';

function SignedIn() {
  const { t } = useLingui();

  return (
    <>
      <nav aria-label={t`Main`} className="flex gap-4">
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
      <Outlet />
    </>
  );
}
