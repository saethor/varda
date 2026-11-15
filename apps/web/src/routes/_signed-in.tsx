import { createFileRoute, redirect } from '@tanstack/react-router';
import { signedInPerson } from '../lib/me.ts';

// Every signed-in page sits under this pathless layout: nobody signed in is sent to sign in.
export const Route = createFileRoute('/_signed-in')({
  beforeLoad: async ({ context }) => {
    const person = await signedInPerson(context.queryClient);
    if (!person) throw redirect({ to: '/sign-in' });
  },
});
