// PROTOTYPE, throw me away. "How should the stone screens look?" (#39 on map #35).
// Four variants on one throwaway route, switchable via ?variant=A|B|C|D and the floating bar.
// D (Feed) is the direction picked so far: a stone opens on its own screen, /prototype/stones/$stoneId.
// Sits outside the signed-in layout so it runs with the web dev server alone, no API or database.
// The real screens would be signed-in, under the same VARÐA header.

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { type UploadOutcome, useFakeStones } from '../prototype/stones/fake.ts';
import { startFeed } from '../prototype/stones/feed-store.ts';
import { type PrototypeSearch, prototypeSearch } from '../prototype/stones/search.ts';
import { PrototypeSwitcher } from '../prototype/stones/switcher.tsx';
import { VariantA } from '../prototype/stones/variant-a.tsx';
import { VariantB } from '../prototype/stones/variant-b.tsx';
import { VariantC } from '../prototype/stones/variant-c.tsx';
import { VariantD } from '../prototype/stones/variant-d.tsx';

const variants = [
  { key: 'D', name: 'Feed' },
  { key: 'A', name: 'Pages' },
  { key: 'B', name: 'Drop zone' },
  { key: 'C', name: 'Weeks' },
];
const older = { A: VariantA, B: VariantB, C: VariantC };

export const Route = createFileRoute('/prototype/stones')({
  validateSearch: prototypeSearch,
  component: StonesPrototype,
});

function StonesPrototype() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const set = (patch: Partial<PrototypeSearch>) => void navigate({ search: { ...search, ...patch }, replace: true });
  startFeed(search.start);

  return (
    <>
      {search.variant === 'D' ? (
        <VariantD search={search} />
      ) : (
        // Re-mount on every switch, so each older variant starts from the chosen state.
        <Older key={`${search.variant}-${search.start}`} search={search} />
      )}
      <PrototypeSwitcher
        variants={variants}
        current={search.variant}
        onVariant={(variant) => set({ variant: variant as PrototypeSearch['variant'] })}
        start={search.start}
        onStart={(start) => set({ start })}
        nextUpload={search.next}
        onNextUpload={(next) => set({ next })}
      />
    </>
  );
}

function Older({ search }: { search: PrototypeSearch }) {
  const fake = useFakeStones(search.start, search.next as UploadOutcome);
  const Component = older[search.variant as keyof typeof older];
  return <Component fake={fake} />;
}
