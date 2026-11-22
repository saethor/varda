import { Trans, useLingui } from '@lingui/react/macro';
import { cn } from '@varda/ui/lib/utils';
import type { ReactNode } from 'react';
import type { StoneDetail } from '../lib/stones.ts';
import { formCharts } from './chart-set.ts';
import { type FormKey, formShown, lapForm } from './form-shown.ts';
import { dyeOf } from './sport-dye.ts';
import { AxisName, axisValue, ChartGroup } from './stone-charts.tsx';
import { ColumnUnit, FigureGroups, StoneSection, tableCell } from './stone-section.tsx';

/**
 * A run's running form: the watch's averages for the stone (step length, vertical oscillation,
 * vertical ratio, ground contact time), each lap's, and a chart of each over the run, drawn as the
 * other charts are. A stone that isn't a run, or a run with no form, shows no section at all.
 */
export function StoneForm({ stone }: { stone: StoneDetail }) {
  const { i18n } = useLingui();
  const shown = formShown(stone.form, i18n.locale);
  const laps = lapForm(stone.laps, i18n.locale);
  const charts = formCharts(stone);
  if (shown.length === 0 && laps.length === 0 && charts === null) return null;

  return (
    <StoneSection
      id="form"
      title={<Trans>Running form</Trans>}
      note={
        charts === null ? null : (
          <>
            <AxisName axis={charts.axis} /> · {axisValue(charts.axis, charts.end, i18n.locale)}
          </>
        )
      }
    >
      {shown.length > 0 && (
        <FigureGroups
          groups={[
            {
              measure: 'stride',
              figures: shown.map(({ key, value }) => ({ key, label: <FormLabel form={key} />, value })),
            },
          ]}
          dye={dyeOf(stone.sport)}
        />
      )}
      {/* With one lap, its form is the stone's own, already above. */}
      {laps.length > 0 && stone.laps.length > 1 && <LapFormTable laps={laps} count={stone.laps.length} />}
      {charts !== null && <ChartGroup set={charts} dye={dyeOf(stone.sport)} counts="steps" />}
    </StoneSection>
  );
}

/** Each lap's form averages, a column for each some lap recorded; units in the heads, bare values below. */
function LapFormTable({ laps, count }: { laps: ReturnType<typeof lapForm>; count: number }) {
  return (
    <div className="overflow-x-auto rounded-xs border bg-card">
      <table className="w-full tabular-nums">
        <thead className="text-left align-bottom text-xs text-muted-foreground">
          <tr className="[&>th]:whitespace-normal">
            <th scope="col" className={cn(tableCell, 'font-medium')}>
              <Trans>Lap</Trans>
            </th>
            {laps.map((column) => (
              <th key={column.key} scope="col" className={cn(tableCell, 'text-right font-medium')}>
                <FormLabel form={column.key} />
                <ColumnUnit>{column.unit}</ColumnUnit>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: count }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: laps are positional and never reorder
            <tr key={i} className="border-t">
              <th scope="row" className={cn(tableCell, 'text-left font-normal')}>
                {i + 1}
              </th>
              {laps.map((column) => (
                <td key={column.key} className={cn(tableCell, 'text-right')}>
                  {column.values[i] ?? '–'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormLabel({ form }: { form: FormKey }): ReactNode {
  switch (form) {
    case 'stepLength':
      return <Trans>Step length</Trans>;
    case 'verticalOscillation':
      return <Trans>Vertical oscillation</Trans>;
    case 'verticalRatio':
      return <Trans>Vertical ratio</Trans>;
    case 'groundContactTime':
      return <Trans>Ground contact time</Trans>;
  }
}
