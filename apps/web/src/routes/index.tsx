import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { orpc } from '../lib/orpc.ts';

const sportsQuery = orpc.shared.sports.list.queryOptions();

export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(sportsQuery),
  component: Home,
});

function Home() {
  const { data: sports } = useSuspenseQuery(sportsQuery);

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-widest">VARÐA</h1>
      <p className="mt-1 text-primary">One stone at a time.</p>
      <h2 className="mt-8 font-medium">Sports</h2>
      <ul className="mt-2 grid grid-cols-2 gap-1 text-sm">
        {sports.map(({ sport, group }) => (
          <li key={sport}>
            {sport} <span className="text-primary">· {group}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
