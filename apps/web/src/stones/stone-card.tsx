import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { Card } from '@varda/ui/components/card';
import { formatDistance, formatDuration } from '@varda/ui/lib/format';
import type { ReactNode } from 'react';
import type { Sport, Stone } from '../lib/stones.ts';
import { LapBars } from './lap-bars.tsx';
import { paceOrSpeed } from './pace-or-speed.ts';
import { TraceSvg } from './trace-svg.tsx';

/** One stone in the feed: what it was, when, its headline numbers and its trace. It opens the stone. */
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
  const pace = paceOrSpeed(stone.sport.sport, stone.distance, stone.movingTime, i18n.locale);

  return (
    <Card className="relative gap-4 p-5 transition-colors has-[a:hover]:border-input">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            {/* The whole card is the link's target; its name is the sport alone. */}
            <Link
              to="/stones/$stoneId"
              params={{ stoneId: stone.id }}
              className="rounded-sm after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
            >
              <SportName sport={stone.sport.sport} />
            </Link>
          </h2>
          <p className="text-muted-foreground">
            {day} · {time} ·{' '}
            {stone.laps.length === 0 ? (
              <Trans>totals only</Trans>
            ) : (
              <Plural value={stone.laps.length} one="# lap" other="# laps" />
            )}
          </p>
        </div>
        {stone.trace !== null && <TraceSvg trace={stone.trace} className="h-20 w-32 shrink-0 text-primary" />}
      </div>
      <dl className="grid grid-cols-2 gap-4 tabular-nums sm:grid-cols-4">
        {stone.distance !== null && (
          <Stat label={<Trans>Distance</Trans>} value={formatDistance(stone.distance, i18n.locale)} />
        )}
        <Stat label={<Trans>Moving time</Trans>} value={formatDuration(stone.movingTime)} />
        {pace && (
          <Stat label={pace.measure === 'pace' ? <Trans>Pace</Trans> : <Trans>Speed</Trans>} value={pace.value} />
        )}
        <Stat label={<Trans>Elapsed time</Trans>} value={formatDuration(stone.elapsedTime)} />
      </dl>
      <LapBars laps={stone.laps} />
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
