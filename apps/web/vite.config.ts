import { lingui } from '@lingui/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Where the API runs. The end-to-end suite starts its own on another port.
const api = process.env.VARDA_API_URL ?? 'http://127.0.0.1:4000';

// The dev server and `vite preview` both pass the API's paths through, so the web app calls one origin.
const proxy = { '/rpc': api };

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    // Compiles the .po catalogs on import and transforms Lingui's macros, without Babel.
    lingui({ macroTransform: true, failOnMissing: true }),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy,
  },
  preview: {
    proxy,
  },
});
