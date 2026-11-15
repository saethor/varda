// The dev menu: switch to any person, or sign out, in one click, in local development only.
// __root.tsx loads it only when `import.meta.env.DEV`, so production builds leave it out.
// Developer tooling, so its strings are plain English and not in the Lingui catalogue.
// It calls the API's dev endpoints directly (served only with VARDA_DEV_MENU=true), since
// they are login endpoints like the rest of /api/auth, not part of the oRPC contract.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { meQuery } from '../lib/me.ts';
import { signOut } from '../sign-in/sign-in.ts';

type Person = { id: string; name: string };

const signedOut = 'signed-out';

async function everyone(): Promise<Person[]> {
  const response = await fetch('/api/auth/dev/persons');
  if (!response.ok) throw new Error(`Listing persons failed: ${response.status} (is VARDA_DEV_MENU=true?)`);
  return (await response.json()) as Person[];
}

/** Signs this browser in as the person, or out for `signedOut`. */
async function switchTo(choice: string): Promise<void> {
  if (choice === signedOut) return await signOut();
  const response = await fetch('/api/auth/dev/impersonate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ personId: choice }),
  });
  if (!response.ok) throw new Error(`Switching to person ${choice} failed: ${response.status}`);
}

export function DevMenu() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const persons = useQuery({ queryKey: ['dev-menu', 'persons'], queryFn: everyone });
  // Failing with UNAUTHORIZED means nobody is signed in, so there is nothing to retry.
  const me = useQuery({ ...meQuery, retry: false });
  const current = me.status === 'success' ? me.data.id : signedOut;

  const switching = useMutation({
    mutationFn: switchTo,
    onSuccess: async () => {
      // Every cached query was for the previous person. Refetch them, then re-run the current
      // route's guards and loaders where we are, so a page the new person can't see sends them on.
      await queryClient.invalidateQueries();
      await router.invalidate();
    },
  });

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-1 rounded-md border bg-background p-2 text-xs shadow-md">
      <label className="flex items-center gap-2">
        <span className="text-muted-foreground">Dev menu: signed in as</span>
        <select
          className="rounded border bg-background px-1 py-0.5"
          value={current}
          disabled={switching.isPending || persons.isPending}
          onChange={(event) => switching.mutate(event.target.value)}
        >
          <option value={signedOut}>Signed out</option>
          {persons.data?.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name} · Athlete
            </option>
          ))}
        </select>
      </label>
      {persons.isError && <p className="text-destructive">{persons.error.message}</p>}
      {switching.isError && <p className="text-destructive">{switching.error.message}</p>}
    </div>
  );
}
