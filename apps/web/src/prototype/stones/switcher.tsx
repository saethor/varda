// PROTOTYPE, throw me away. The floating bar that flips between variants and rigs the fake.

import { useEffect } from 'react';
import { type UploadOutcome, uploadOutcomes } from './fake.ts';

export type Variant = { key: string; name: string };

export function PrototypeSwitcher({
  variants,
  current,
  onVariant,
  start,
  onStart,
  nextUpload,
  onNextUpload,
}: {
  variants: Variant[];
  current: string;
  onVariant: (key: string) => void;
  start: 'empty' | 'stones';
  onStart: (start: 'empty' | 'stones') => void;
  nextUpload: UploadOutcome;
  onNextUpload: (outcome: UploadOutcome) => void;
}) {
  const index = Math.max(
    0,
    variants.findIndex((v) => v.key === current),
  );
  const step = (by: number) => onVariant(variants[(index + by + variants.length) % variants.length]!.key);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)
        return;
      if (el instanceof HTMLElement && el.isContentEditable) return;
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex max-w-[95vw] -translate-x-1/2 flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl whitespace-nowrap bg-black px-4 py-2 text-xs text-white shadow-2xl ring-2 ring-fuchsia-500">
      <span className="font-bold text-fuchsia-300">PROTOTYPE</span>
      <button type="button" className="px-1 text-base" onClick={() => step(-1)} aria-label="Previous variant">
        ←
      </button>
      <span className="text-center">
        {variants[index]!.key} ({variants[index]!.name})
      </span>
      <button type="button" className="px-1 text-base" onClick={() => step(1)} aria-label="Next variant">
        →
      </button>
      <span className="opacity-40">|</span>
      <label className="flex items-center gap-1">
        start
        <select
          className="rounded bg-neutral-800 px-1"
          value={start}
          onChange={(e) => onStart(e.target.value as 'empty' | 'stones')}
        >
          <option value="empty">empty</option>
          <option value="stones">with stones</option>
        </select>
      </label>
      <label className="flex items-center gap-1">
        next upload
        <select
          className="rounded bg-neutral-800 px-1"
          value={nextUpload}
          onChange={(e) => onNextUpload(e.target.value as UploadOutcome)}
        >
          {uploadOutcomes.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
