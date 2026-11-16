import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Card } from '@varda/ui/components/card';
import { formatDistance, formatDuration } from '@varda/ui/lib/format';
import type { ReactNode } from 'react';
import type { Sport, Stone } from '../lib/stones.ts';

/** One stone in the feed: what it was, when, and its headline numbers. */
export function StoneCard({ stone }: { stone: Stone }) {
  const { i18n } = useLingui();
  // A local date has no zone: shown as written, never shifted into the browser's.
  const day = i18n.date(new Date(`${stone.localDate}T00:00:00Z`), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const time = i18n.date(stone.start, { timeStyle: 'short' });

  return (
    <Card className="gap-4 p-5">
      <div>
        <h2 className="text-lg font-semibold">
          <SportName sport={stone.sport.sport} />
        </h2>
        <p className="text-muted-foreground">
          {day} · {time} · <Plural value={stone.laps.length} one="# lap" other="# laps" />
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-4 tabular-nums sm:grid-cols-3">
        {stone.distance !== null && (
          <Stat label={<Trans>Distance</Trans>} value={formatDistance(stone.distance, i18n.locale)} />
        )}
        <Stat label={<Trans>Moving time</Trans>} value={formatDuration(stone.movingTime)} />
        <Stat label={<Trans>Elapsed time</Trans>} value={formatDuration(stone.elapsedTime)} />
      </dl>
    </Card>
  );
}

function Stat({ label, value }: { label: ReactNode; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xl">{value}</dd>
    </div>
  );
}

export function SportName({ sport }: { sport: Sport }) {
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
