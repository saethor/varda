import { Trans, useLingui } from '@lingui/react/macro';
import type { ReactNode } from 'react';
import type { Stone } from '../lib/stones.ts';
import { type FigureKey, figuresShown } from './figures-shown.ts';

/**
 * The stone's summary: the figures its watch recorded (heart rate, ascent and descent, cadence,
 * power, temperature, calories), as recorded. One it didn't record isn't shown, and a stone with
 * none shows no section at all.
 */
export function StoneFigures({ stone }: { stone: Stone }) {
  const { i18n } = useLingui();
  const shown = figuresShown(stone.figures, stone.sport.sport, i18n.locale);
  if (shown.length === 0) return null;

  return (
    <section aria-labelledby="summary" className="flex flex-col gap-3">
      <header className="border-b border-foreground pb-2">
        <h2 id="summary" className="text-lg font-semibold">
          <Trans>Summary</Trans>
        </h2>
      </header>
      <dl className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-6 gap-y-4 tabular-nums">
        {shown.map(({ key, value }) => (
          <div key={key} className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">
              <FigureLabel figure={key} />
            </dt>
            <dd className="text-xl whitespace-nowrap">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function FigureLabel({ figure }: { figure: FigureKey }): ReactNode {
  switch (figure) {
    case 'averageHeartRate':
      return <Trans>Average heart rate</Trans>;
    case 'maxHeartRate':
      return <Trans>Max heart rate</Trans>;
    case 'ascent':
      return <Trans>Ascent</Trans>;
    case 'descent':
      return <Trans>Descent</Trans>;
    case 'averageCadence':
      return <Trans>Average cadence</Trans>;
    case 'maxCadence':
      return <Trans>Max cadence</Trans>;
    case 'averagePower':
      return <Trans>Average power</Trans>;
    case 'maxPower':
      return <Trans>Max power</Trans>;
    case 'normalizedPower':
      return <Trans>Normalized power</Trans>;
    case 'minTemperature':
      return <Trans>Min temperature</Trans>;
    case 'averageTemperature':
      return <Trans>Average temperature</Trans>;
    case 'maxTemperature':
      return <Trans>Max temperature</Trans>;
    case 'calories':
      return <Trans>Calories</Trans>;
  }
}
