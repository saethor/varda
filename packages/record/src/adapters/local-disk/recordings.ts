import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Recordings } from '../../application/ports.ts';

/**
 * Recordings as files on the local disk, `<dir>/<stoneId>.fit`, for local development.
 * The EU object-storage adapter takes its place when deployed, behind the same port.
 */
export function createLocalDiskRecordings(dir: string): Recordings {
  const pathOf = (stoneId: string) => join(dir, `${stoneId}.fit`);
  return {
    async put(stoneId, bytes) {
      await mkdir(dir, { recursive: true });
      await writeFile(pathOf(stoneId), bytes);
    },
    async get(stoneId) {
      try {
        return new Uint8Array(await readFile(pathOf(stoneId)));
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null;
        throw error;
      }
    },
    async remove(stoneId) {
      await rm(pathOf(stoneId), { force: true });
    },
  };
}
