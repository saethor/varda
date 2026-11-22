import { Trans, useLingui } from '@lingui/react/macro';
import { type PointerEvent, useMemo, useState } from 'react';
import type { StoneDetail } from '../lib/stones.ts';
import { stoneCharts } from './chart-set.ts';
import { cadenceCountsOf } from './figures-shown.ts';
import { lapSpans, type Span, spanWithMargin } from './lap-spans.ts';
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
  const [wide, setWide] = useState(false);
  // The charts' zoom is held here, so a lap clicked in the laps zooms them in on it; the lap picked
  // stays lit while nothing else is pointed at, until the charts zoom out or elsewhere.
  const [zoom, setZoom] = useState<Span | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
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
  // Clicking the lap zoomed in on zooms back out.
  const pick = (lap: number) => {
    const span = spans?.[lap];
    if (span === undefined || picked === lap) return zoomTo(null);
    setZoom(spanWithMargin(span, set.end));
    setPicked(lap);
  };
  const zoomTo = (span: Span | null) => {
    setZoom(span);
    setPicked(null);
  };

  return (
    <div onPointerLeave={leave}>
      <StoneLaps
        stone={stone}
        // The lap the charts are zoomed in on stays lit in the laps while no other is pointed at.
        active={active ?? picked}
        onActive={(lap) => lap !== null && setActive(lap)}
        chartsWide={wide}
        onPick={pick}
        charts={
          <ChartGroup
            set={set}
            dye={dye}
            counts={counts}
            focus={focusOf(active ?? picked)}
            zoom={zoom}
            onZoom={zoomTo}
            density={wide ? 'expanded' : 'compact'}
            heading={
              <>
                <Trans>Charts</Trans> · <AxisName axis={set.axis} /> · {axisValue(set.axis, set.end, i18n.locale)}
              </>
            }
            expand={{ on: wide, onToggle: () => setWide((now) => !now) }}
          />
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
