import { cn } from '@varda/ui/lib/utils';
import type { ReactNode } from 'react';
import { type Measure, measureText } from './measure-tint.ts';
import type { Dye } from './sport-dye.ts';

/**
 * One section of the stone screen: its name over a rule, with a short note at the other end when
 * it has one (a count, what it runs along), then what it holds.
 */
export function StoneSection({
  id,
  title,
  note,
  children,
}: {
  /** Names the section for its heading's `aria-labelledby`. */
  id: string;
  title: ReactNode;
  note: ReactNode | null;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-foreground pb-2">
        <h2 id={id} className="text-lg font-semibold">
          {title}
        </h2>
        {note !== null && <p className="text-sm text-muted-foreground tabular-nums">{note}</p>}
      </header>
      {children}
    </section>
  );
}

/** A cell of a stone section's table: values never wrap, and the first and last keep the panel's inset. */
export const tableCell = 'whitespace-nowrap px-2 py-2.5 first:pl-4 last:pr-4 sm:px-4';

/** A column's unit, under its name, so the cells below can hold bare values. */
export function ColumnUnit({ children }: { children: string }) {
  return <span className="block font-normal">{children}</span>;
}

export type Figure = { key: string; label: ReactNode; value: string };

/**
 * The watch's figures in groups by measure, name over value, each group under a stitch of its
 * measure's tint, the same stitch that keys its chart; figures of no chart sit under an undyed one.
 * A figure the watch didn't record is left out by the caller.
 */
export function FigureGroups({ groups, dye }: { groups: { measure: Measure; figures: Figure[] }[]; dye: Dye }) {
  return (
    <div className="flex flex-wrap gap-x-10 gap-y-6 pt-1 tabular-nums">
      {groups.map(({ measure, figures }) => (
        <div key={measure} className={cn('flex min-w-0 flex-col gap-3', measureText(measure, dye))}>
          <span aria-hidden className="h-1 w-full min-w-8 rounded-xs bg-current" />
          <dl className="flex flex-wrap gap-x-6 gap-y-3 text-foreground">
            {figures.map(({ key, label, value }) => (
              <div key={key} className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-xl font-medium whitespace-nowrap">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
