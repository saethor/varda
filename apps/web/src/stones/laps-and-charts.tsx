import { Trans, useLingui } from '@lingui/react/macro';
import { type PointerEvent, useMemo, useState } from 'react';
import type { StoneDetail } from '../lib/stones.ts';
import { stoneCharts } from './chart-set.ts';
import { cadenceCountsOf } from './figures-shown.ts';
import { lapSpans, spanWithMargin } from './lap-spans.ts';
import { dyeOf } from './sport-dye.ts';
import { AxisName, axisValue, type ChartFocus, ChartGroup, StoneCharts } from './stone-charts.tsx';
import { StoneLaps } from './stone-laps.tsx';

/**
 * The stone's laps and its charts, read together: pointing at a lap (its row in the profile or the
 * table) lights its stretch of every chart. From 1024px the charts stand beside the upright lap
 * profile. A lap's row in the table opens onto its own charts, zoomed in on it. A stone of one lap
 * or none keeps its charts in their own section.
 */
export function LapsAndCharts({ stone }: { stone: StoneDetail }) {
  const { t, i18n } = useLingui();
  // The lap pointed at holds while the pointer crosses to the charts, until another lap is pointed
  // at or the pointer leaves the laps altogether.
  const [active, setActive] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const set = useMemo(() => stoneCharts(stone), [stone]);
  const spans = useMemo(() => (set === null ? null : lapSpans(stone, set.axis)), [stone, set]);

  if (set === null || stone.laps.length < 2) {
    return (
      <>
        <StoneLaps stone={stone} active={active} onActive={setActive} />
        <StoneCharts stone={stone} />
      </>
    );
  }

  const focusOf = (lap: number | null): ChartFocus | null => {
    const span = lap === null ? undefined : spans?.[lap];
    return lap === null || span === undefined ? null : { span, label: t`Lap ${lap + 1}` };
  };
  const dye = dyeOf(stone.sport);
  const counts = cadenceCountsOf(stone.sport.sport);
  const leave = (event: PointerEvent) => event.pointerType === 'mouse' && setActive(null);

  return (
    <div onPointerLeave={leave}>
      <StoneLaps
        stone={stone}
        active={active}
        onActive={(lap) => lap !== null && setActive(lap)}
        charts={
          <div className="flex flex-col gap-1.5">
            <p className="flex flex-wrap items-baseline justify-between gap-x-4 text-xs text-muted-foreground tabular-nums">
              <span>
                <Trans>Charts</Trans>
              </span>
              <span>
                <AxisName axis={set.axis} /> · {axisValue(set.axis, set.end, i18n.locale)}
              </span>
            </p>
            <ChartGroup set={set} dye={dye} counts={counts} focus={focusOf(active)} density="compact" />
          </div>
        }
        lens={{
          open,
          onOpen: setOpen,
          draw: (lap) => {
            const lens = focusOf(lap);
            return lens === null ? null : (
              <ChartGroup
                set={set}
                dye={dye}
                counts={counts}
                focus={lens}
                view={spanWithMargin(lens.span, set.end)}
                density="compact"
              />
            );
          },
        }}
      />
    </div>
  );
}
