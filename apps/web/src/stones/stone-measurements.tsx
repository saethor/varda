import { Trans, useLingui } from '@lingui/react/macro';
import { formatHeartRate, formatHeight, formatWeight } from '@varda/ui/lib/format';
import type { ReactNode } from 'react';
import type { StoneDetail } from '../lib/stones.ts';
import { StoneSection } from './stone-section.tsx';

/**
 * The athlete's measurements as the watch had them on the stone's day: weight, height, resting and
 * max heart rate, each only when there is one. A coach is never sent weight or height, so they never
 * show here for one. Nothing at all when there are none.
 */
export function StoneMeasurements({ stone }: { stone: StoneDetail }) {
  const { i18n } = useLingui();
  const { measurements } = stone;
  if (measurements === null) return null;

  const shown: { key: string; label: ReactNode; value: string }[] = [];
  if (measurements.weight !== null)
    shown.push({ key: 'weight', label: <Trans>Weight</Trans>, value: formatWeight(measurements.weight, i18n.locale) });
  if (measurements.height !== null)
    shown.push({ key: 'height', label: <Trans>Height</Trans>, value: formatHeight(measurements.height) });
  if (measurements.restingHeartRate !== null)
    shown.push({
      key: 'restingHeartRate',
      label: <Trans>Resting heart rate</Trans>,
      value: formatHeartRate(measurements.restingHeartRate, i18n.locale),
    });
  if (measurements.maxHeartRate !== null)
    shown.push({
      key: 'maxHeartRate',
      label: <Trans>Max heart rate</Trans>,
      value: formatHeartRate(measurements.maxHeartRate, i18n.locale),
    });
  if (shown.length === 0) return null;

  return (
    <StoneSection
      id="measurements"
      title={<Trans>Measurements</Trans>}
      note={<Trans>As the watch had them that day</Trans>}
    >
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] gap-x-6 gap-y-4 tabular-nums">
        {shown.map((each) => (
          <div key={each.key} className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">{each.label}</dt>
            <dd className="text-xl whitespace-nowrap">{each.value}</dd>
          </div>
        ))}
      </dl>
    </StoneSection>
  );
}
