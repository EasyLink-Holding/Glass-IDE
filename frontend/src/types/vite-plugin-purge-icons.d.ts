// Project-local shim until vite-plugin-purge-icons publishes proper export typings
// -----------------------------------------------------------------------------
// We keep strict Node16 module resolution but still get type-safety and
// autocomplete when configuring the plugin in `vite.config.ts`.
// Delete this file once the package adds its own `index.d.ts` to the exports map.

declare module 'vite-plugin-purge-icons' {
  import type { Plugin } from 'vite';

  /** Options are loosely typed; extend as needed */
  const plugin: (options?: Record<string, unknown>) => Plugin;
  export default plugin;
}
