import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import checker from 'vite-plugin-checker';
import PurgeIcons from 'vite-plugin-purge-icons';

// https://vite.dev/config/
// -----------------------------------------------------------------------------
// Vite configuration – performance-focused
//
// 1. splitVendorChunkPlugin – automatic vendor chunking
// 2. manualChunks()     – fine grained control (Monaco, React, Phosphor)
// 3. visualizer()       – generate dist/stats.html treemap after build
// -----------------------------------------------------------------------------

export default defineConfig({
  plugins: [
    react(),
    // Enables out-of-the-box vendor chunk splitting
    splitVendorChunkPlugin(),
    // Removes unused Phosphor icons (tree-shaking for icon sets)
    PurgeIcons({
      /* keep defaults */
    }),
    // Type-checker runs in a separate thread – keeps HMR snappy
    checker({ typescript: true }),
    // `pnpm build` then open dist/stats.html to audit bundles
    visualizer({ filename: 'dist/stats.html', template: 'treemap', open: false }),
  ],

  build: {
    sourcemap: false, // smaller bundles
    rollupOptions: {
      output: {
        // Custom manual chunk rules to isolate heavy deps
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        manualChunks(id: string): string | undefined {
          // Group search UI into its own chunk for preloading
          if (id.includes('/features/search/')) return 'search';

          if (id.includes('node_modules')) {
            if (id.includes('monaco-editor')) return 'monaco';
            if (id.includes('phosphor-react')) return 'phosphor';
            if (id.match(/react(\\|\/)/)) return 'react';
          }
          return undefined;
        },
      },
    },
  },
});
