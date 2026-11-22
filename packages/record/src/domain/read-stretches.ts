// The watch's run/walk detection, read from its split records. FIT words stay in this file.
import type { SplitMesg, SplitSummaryMesg } from '@garmin/fitsdk';
import type { Sport } from '@varda/shared';
import { isRunning } from './sports.ts';
import type { Stretch, Stretches, StretchKind, StretchTotal } from './stone.ts';

// Only the run/walk detection split types are stretches; Garmin's interval, climb, ski… types are not.
const kinds: Partial<Record<string, StretchKind>> = { rwdRun: 'running', rwdWalk: 'walking', rwdStand: 'standing' };

const kindOf = (splitType: unknown): StretchKind | undefined => kinds[String(splitType)];

/** A run's stretches, or none for another sport or a run the watch detected no stretches in. */
export function readStretches(
  sport: Sport,
  {
    splitMesgs: splits = [],
    splitSummaryMesgs: summaries = [],
  }: { splitMesgs?: SplitMesg[]; splitSummaryMesgs?: SplitSummaryMesg[] },
  dateOf: (value: unknown) => Date,
): Stretches | null {
  if (!isRunning(sport)) return null;
  const inOrder = splits
    .flatMap((split): Stretch[] => {
      const kind = kindOf(split.splitType);
      if (kind === undefined) return [];
      return [
        {
          kind,
          start: dateOf(split.startTime),
          movingTime: split.totalTimerTime ?? null,
          distance: split.totalDistance ?? null,
        },
      ];
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  if (inOrder.length === 0) return null;

  const totalOf = (kind: StretchKind): StretchTotal | null => {
    const summary = summaries.find((each) => kindOf(each.splitType) === kind);
    if (summary === undefined) return null;
    return { movingTime: summary.totalTimerTime ?? null, distance: summary.totalDistance ?? null };
  };
  return {
    inOrder,
    totals: { running: totalOf('running'), walking: totalOf('walking'), standing: totalOf('standing') },
  };
}
