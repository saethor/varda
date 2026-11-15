import { createFileRoute, redirect } from '@tanstack/react-router';
import { signedInPerson } from '../lib/me.ts';

// Every signed-in page sits under this pathless layout: nobody signed in is sent to sign in,
// and comes back here afterwards.
export const Route = createFileRoute('/_signed-in')({
  beforeLoad: async ({ context, location }) => {
    if (!(await signedInPerson(context.queryClient))) {
      throw redirect({ to: '/sign-in', search: { redirect: location.href } });
    }
  },
});
