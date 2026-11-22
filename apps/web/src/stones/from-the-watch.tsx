import { Trans } from '@lingui/react/macro';
import type { StoneDetail } from '../lib/stones.ts';

/** Where the stone came from: the watch that recorded it, by its model when Varða knows it, and the file. */
export function FromTheWatch({ stone: { device, fileName } }: { stone: StoneDetail }) {
  if (device?.model) {
    const model = device.model;
    return (
      <Trans>
        From your {model} · {fileName}
      </Trans>
    );
  }
  if (device) {
    const manufacturer = device.manufacturer;
    return (
      <Trans>
        From your {manufacturer} watch · {fileName}
      </Trans>
    );
  }
  return <Trans>From your watch · {fileName}</Trans>;
}

/** How hard the stone felt, as the athlete rated it on the watch. Nothing when they didn't. */
export function StoneEffort({ stone: { effort } }: { stone: StoneDetail }) {
  if (effort === null) return null;
  return (
    <dl className="flex items-baseline gap-2 text-sm tabular-nums">
      <dt className="text-muted-foreground">
        <Trans>Effort</Trans>
      </dt>
      <dd>
        <Trans>{effort} of 10</Trans>
      </dd>
    </dl>
  );
}
