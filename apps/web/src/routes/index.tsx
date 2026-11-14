import { Trans } from '@lingui/react/macro';
import type { InferContractRouterOutputs } from '@orpc/contract';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import type { Contract } from '@varda/contract';
import { orpc } from '../lib/orpc.ts';

type Sport = InferContractRouterOutputs<Contract>['shared']['sports']['list'][number];

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
      <p className="mt-1 text-primary">
        <Trans>One stone at a time.</Trans>
      </p>
      <h2 className="mt-8 font-medium">
        <Trans>Sports</Trans>
      </h2>
      <ul className="mt-2 grid grid-cols-2 gap-1 text-sm">
        {sports.map(({ sport, group }) => (
          <li key={sport}>
            <SportName sport={sport} />{' '}
            <span className="text-primary">
              · <SportGroupName group={group} />
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function SportName({ sport }: { sport: Sport['sport'] }) {
  switch (sport) {
    case 'road-running':
      return <Trans>Road running</Trans>;
    case 'trail-running':
      return <Trans>Trail running</Trans>;
    case 'track-running':
      return <Trans>Track running</Trans>;
    case 'treadmill-running':
      return <Trans>Treadmill running</Trans>;
    case 'strength':
      return <Trans>Strength</Trans>;
    case 'cycling':
      return <Trans>Cycling</Trans>;
    case 'swimming':
      return <Trans>Swimming</Trans>;
    case 'skiing':
      return <Trans>Skiing</Trans>;
    case 'hiking':
      return <Trans>Hiking</Trans>;
    case 'walking':
      return <Trans>Walking</Trans>;
    case 'other':
      return <Trans>Other</Trans>;
  }
}

function SportGroupName({ group }: { group: Sport['group'] }) {
  switch (group) {
    case 'running':
      return <Trans>Running</Trans>;
    case 'strength':
      return <Trans>Strength</Trans>;
    case 'cross-training':
      return <Trans>Cross-training</Trans>;
  }
}
