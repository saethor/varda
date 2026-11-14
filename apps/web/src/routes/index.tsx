import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@varda/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@varda/ui/components/card';
import { orpc } from '../lib/orpc.ts';

const sportsQuery = orpc.shared.sports.list.queryOptions();

export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(sportsQuery),
  component: Home,
});

function Home() {
  const { data: sports, refetch, isFetching } = useSuspenseQuery(sportsQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl tracking-widest">VARÐA</CardTitle>
        <CardDescription>One stone at a time.</CardDescription>
      </CardHeader>
      <CardContent>
        <h2 className="font-medium">Sports</h2>
        <ul className="mt-2 grid grid-cols-2 gap-1 text-sm">
          {sports.map(({ sport, group }) => (
            <li key={sport}>
              {sport} <span className="text-primary">· {group}</span>
            </li>
          ))}
        </ul>
        <Button className="mt-6" disabled={isFetching} onClick={() => void refetch()}>
          Refresh
        </Button>
      </CardContent>
    </Card>
  );
}
