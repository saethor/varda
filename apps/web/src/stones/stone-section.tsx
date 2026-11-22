import type { ReactNode } from 'react';

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

/** The watch's figures as a grid of name over value, one it didn't record left out by the caller. */
export function FigureGrid({ figures }: { figures: { key: string; label: ReactNode; value: string }[] }) {
  return (
    <dl className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-x-6 gap-y-4 tabular-nums">
      {figures.map(({ key, label, value }) => (
        <div key={key} className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="text-xl whitespace-nowrap">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
