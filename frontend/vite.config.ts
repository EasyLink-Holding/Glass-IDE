import preact from '@preact/preset-vite';
import wasm from '@rollup/plugin-wasm';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import checker from 'vite-plugin-checker';
// vite-plugin-monaco-editor is CommonJS; handle `default` interop safely
import monacoEditorPluginImport from 'vite-plugin-monaco-editor';

type MonacoPluginFn = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: Record<string, unknown>
) => import('vite').Plugin;

const monacoEditorPlugin: MonacoPluginFn =
  (monacoEditorPluginImport as { default?: MonacoPluginFn }).default ??
  (monacoEditorPluginImport as unknown as MonacoPluginFn);

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
  // Ensure web workers are bundled as ES modules; Rollup disallows IIFE when
  // code-splitting is enabled (our default). This fixes the build error coming
  // from workerPool.ts.
  worker: {
    format: 'es',
  },
  plugins: [
    // First: WASM support – allows importing .wasm (eg. tree-sitter grammars)
    // rollup-plugin-wasm handles copying/instantiating in both dev & prod builds
    wasm(),
    monacoEditorPlugin({
      languageWorkers: ['editorWorkerService', 'css', 'html', 'json', 'typescript'],
    }),
    preact(),
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
  // No custom alias; WASM imports point directly to tree-sitter-wasms/out
  build: {
    sourcemap: false, // smaller bundles
    // Ensure .wasm assets in node_modules (tree-sitter) are copied & hashed
    assetsInlineLimit: 0, // never inline – keep separate files, caching friendly
    rollupOptions: {
      output: {
        // Custom manual chunk rules to isolate heavy deps
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        manualChunks(id: string): string | undefined {
          // Feature-based groups – tweak for better cacheability & preload strategies
          if (id.includes('/app/editor/')) return 'editor';
          if (id.includes('/app/versionControl/')) return 'vcs';
          if (id.includes('/app/marketplace/')) return 'marketplace';
          if (id.includes('/app/teams/') || id.includes('/app/organization/')) return 'teams';
          if (id.includes('/features/search/')) return 'search';

          // Vendor libraries
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
  // Treat all .wasm files as static assets so import "?url" works both in dev & build
  assetsInclude: ['**/*.wasm'],
});
