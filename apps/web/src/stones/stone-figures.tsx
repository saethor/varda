import { Trans, useLingui } from '@lingui/react/macro';
import type { ReactNode } from 'react';
import type { Stone } from '../lib/stones.ts';
import { type FigureKey, figuresShown } from './figures-shown.ts';
import { byMeasure, figureMeasure } from './measure-tint.ts';
import { dyeOf } from './sport-dye.ts';
import { FigureGroups, StoneSection } from './stone-section.tsx';

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
    <StoneSection id="summary" title={<Trans>Summary</Trans>} note={null}>
      <FigureGroups
        groups={byMeasure(shown, ({ key }) => figureMeasure[key]).map(({ measure, items }) => ({
          measure,
          figures: items.map(({ key, value }) => ({ key, label: <FigureLabel figure={key} />, value })),
        }))}
        dye={dyeOf(stone.sport)}
      />
    </StoneSection>
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
