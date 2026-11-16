import { rmSync } from 'node:fs';

/** Removes the run's recordings directory that playwright.config.ts made. */
export default function globalTeardown(): void {
  const recordingsDir = process.env.VARDA_E2E_RECORDINGS_DIR;
  if (recordingsDir !== undefined) rmSync(recordingsDir, { recursive: true, force: true });
}
