// Lingui's Vite plugin compiles a .po catalog into its messages when it is imported.
declare module '*.po' {
  import type { Messages } from '@lingui/core';

  export const messages: Messages;
}
