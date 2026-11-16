import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import type { TurnedAwayReason } from '@varda/contract';
import { Alert, AlertDescription, AlertTitle } from '@varda/ui/components/alert';
import { linkClassName } from '../components/form.tsx';
import type { Stone } from '../lib/stones.ts';
import { midnightOf } from './local-date.ts';

/** Why a stone wasn't placed: the session already was, or the file was turned away, by the browser or the server. */
export type Refusal = { alreadyPlaced: string } | { turnedAway: TurnedAwayReason };

/**
 * Says why a stone wasn't placed. The stone already placed from the session is linked, and named
 * when the feed has it loaded.
 */
export function PlacingRefusal({ refusal, stones }: { refusal: Refusal; stones: Stone[] }) {
  if ('alreadyPlaced' in refusal) {
    const placedBefore = stones.find(({ id }) => id === refusal.alreadyPlaced);
    return (
      <Alert>
        <AlertTitle>
          <Trans>Already placed</Trans>
        </AlertTitle>
        <AlertDescription>
          <p>
            {placedBefore ? (
              <PlacedBefore stone={placedBefore} />
            ) : (
              <Trans>You already placed a stone from this session.</Trans>
            )}
          </p>
          <Link to="/stones/$stoneId" params={{ stoneId: refusal.alreadyPlaced }} className={linkClassName}>
            <Trans>Open that stone</Trans>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert variant="destructive">
      <AlertTitle>
        <Trans>Turned away</Trans>
      </AlertTitle>
      <AlertDescription>
        <p>
          <Reason reason={refusal.turnedAway} />
        </p>
        <p>
          <Trans>Nothing was kept.</Trans>
        </p>
      </AlertDescription>
    </Alert>
  );
}

function PlacedBefore({ stone }: { stone: Stone }) {
  const { i18n } = useLingui();
  // A local date has no zone: shown as written, never shifted into the browser's.
  const day = i18n.date(midnightOf(stone.localDate), { dateStyle: 'medium', timeZone: 'UTC' });
  const fileName = stone.fileName;
  return (
    <Trans>
      You already placed a stone from this session: the one placed from {fileName}, on {day}.
    </Trans>
  );
}

function Reason({ reason }: { reason: TurnedAwayReason }) {
  switch (reason) {
    case 'not-a-fit-file':
      return <Trans>This isn't a FIT file. Choose the .fit file your watch saved.</Trans>;
    case 'too-large':
      return <Trans>This file is larger than 25 MB.</Trans>;
    case 'broken':
      return <Trans>This FIT file is broken. Copy it off your watch again.</Trans>;
    case 'not-a-session':
      return <Trans>This FIT file holds no session, such as settings, a course or a workout.</Trans>;
    case 'multisport':
      return <Trans>This is a multisport session, such as a triathlon. Varða can't place those yet.</Trans>;
  }
}
