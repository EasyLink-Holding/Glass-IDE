// Additional Vite config to alias missing tree-sitter wasm URLs
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      // Redirect to our local wasm copy bundled under assets
      'tree-sitter-rust/tree-sitter-rust.wasm?url':
        '/src/workers/treesitter/wasm/tree-sitter-rust.wasm?url',
    },
  },
});
