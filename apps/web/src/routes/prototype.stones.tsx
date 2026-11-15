// PROTOTYPE, throw me away. "How should the stone screens look?" (#39 on map #35).
// Three variants on one throwaway route, switchable via ?variant=A|B|C and the floating bar.
// Sits outside the signed-in layout so it runs with the web dev server alone, no API or database.
// The real screens would be signed-in, under the same VARÐA header.

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { uploadOutcomes, useFakeStones } from '../prototype/stones/fake.ts';
import { PrototypeSwitcher } from '../prototype/stones/switcher.tsx';
import { VariantA } from '../prototype/stones/variant-a.tsx';
import { VariantB } from '../prototype/stones/variant-b.tsx';
import { VariantC } from '../prototype/stones/variant-c.tsx';

const variants = [
  { key: 'A', name: 'Pages', Component: VariantA },
  { key: 'B', name: 'Drop zone', Component: VariantB },
  { key: 'C', name: 'Weeks', Component: VariantC },
];

export const Route = createFileRoute('/prototype/stones')({
  validateSearch: z.object({
    variant: z.enum(['A', 'B', 'C']).catch('A'),
    start: z.enum(['empty', 'stones']).catch('stones'),
    next: z.enum(uploadOutcomes as [string, ...string[]]).catch('placed'),
  }),
  component: StonesPrototype,
});

function StonesPrototype() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const set = (patch: Partial<typeof search>) => void navigate({ search: { ...search, ...patch }, replace: true });
  const current = variants.find((v) => v.key === search.variant) ?? variants[0]!;

  return (
    <>
      {/* Re-mount on every switch, so each variant starts from the chosen state. */}
      <Fake
        key={`${search.variant}-${search.start}`}
        start={search.start}
        next={search.next}
        Component={current.Component}
      />
      <PrototypeSwitcher
        variants={variants}
        current={search.variant}
        onVariant={(variant) => set({ variant: variant as 'A' | 'B' | 'C' })}
        start={search.start}
        onStart={(start) => set({ start })}
        nextUpload={search.next as (typeof uploadOutcomes)[number]}
        onNextUpload={(next) => set({ next })}
      />
    </>
  );
}

function Fake({
  start,
  next,
  Component,
}: {
  start: 'empty' | 'stones';
  next: string;
  Component: (typeof variants)[number]['Component'];
}) {
  const fake = useFakeStones(start, next as (typeof uploadOutcomes)[number]);
  return <Component fake={fake} />;
}
