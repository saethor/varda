import { createFileRoute, redirect } from '@tanstack/react-router';
import { signedInPerson } from '../lib/me.ts';

// Every signed-in page sits under this pathless layout: nobody signed in is sent to sign in,
// and comes back here afterwards.
export const Route = createFileRoute('/_signed-in')({
  beforeLoad: async ({ context, location }) => {
    const person = await signedInPerson(context.queryClient);
    if (!person) throw redirect({ to: '/sign-in', search: { redirect: location.href } });
    return { person };
  },
});
