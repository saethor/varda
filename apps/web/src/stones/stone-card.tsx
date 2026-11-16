import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Card } from '@varda/ui/components/card';
import { formatDistance, formatDuration } from '@varda/ui/lib/format';
import type { ReactNode } from 'react';
import type { Sport, Stone } from '../lib/stones.ts';
import { lapStrip } from './lap-strip.ts';
import { paceOrSpeed } from './pace-or-speed.ts';

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
  const pace = paceOrSpeed(stone.sport.sport, stone.distance, stone.movingTime, i18n.locale);

  return (
    <Card className="gap-4 p-5">
      <div>
        <h2 className="text-lg font-semibold">
          <SportName sport={stone.sport.sport} />
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
      <LapStrip laps={stone.laps} />
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

/** Each lap as a bar: width by distance, height by speed. Decorative: the lap count says it in words. */
function LapStrip({ laps }: { laps: Stone['laps'] }) {
  const bars = lapStrip(laps);
  if (bars.length === 0) return null;
  return (
    <div className="flex h-12 items-end gap-0.5" aria-hidden>
      {bars.map((bar, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: laps are positional and never reorder
          key={i}
          className="rounded-t-sm bg-primary/70"
          style={{ flexGrow: bar.width, flexBasis: 0, height: `${bar.height * 100}%` }}
        />
      ))}
    </div>
  );
}

function SportName({ sport }: { sport: Sport }) {
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
