import { maxWatchFileBytes } from '@varda/contract';

/**
 * Why the browser turns a watch file away before sending it, or null to send it. Only a quick
 * look at its name and size: the server reads the file itself and stays the authority.
 */
export function checkWatchFile({ name, size }: { name: string; size: number }): 'not-a-fit-file' | 'too-large' | null {
  if (!name.toLowerCase().endsWith('.fit')) return 'not-a-fit-file';
  if (size > maxWatchFileBytes) return 'too-large';
  return null;
}
