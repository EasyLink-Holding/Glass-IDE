// -----------------------------------------------------------------------------
// Dynamic Tree-sitter language loaders (WASM)
// NOTE: keep the list in sync with dependencies in package.json to avoid
//       missing-module errors. Add new languages incrementally.
// -----------------------------------------------------------------------------

import Parser from 'web-tree-sitter';

export type SupportedLanguage = 'typescript' | 'tsx' | 'rust';

// Cache promises so multiple concurrent callers don't duplicate work.
const inflight: Partial<Record<SupportedLanguage, Promise<Parser.Language>>> = {};

export async function loadLanguage(lang: SupportedLanguage): Promise<Parser.Language> {
  let promise = inflight[lang];
  if (promise) return promise;

  promise = (async () => {
    await Parser.init();
    switch (lang) {
      case 'typescript': {
        const wasmUrl = (await import('tree-sitter-typescript/tree-sitter-typescript.wasm?url'))
          .default as string;
        return Parser.Language.load(wasmUrl);
      }
      case 'tsx': {
        const wasmUrl = (await import('tree-sitter-typescript/tree-sitter-tsx.wasm?url'))
          .default as string;
        return Parser.Language.load(wasmUrl);
      }
      case 'rust': {
        const wasmUrl = (await import('tree-sitter-rust/tree-sitter-rust.wasm?url'))
          .default as string;
        return Parser.Language.load(wasmUrl);
      }
      default:
        throw new Error(`Unsupported language ${lang}`);
    }
  })();

  inflight[lang] = promise;
  return promise;
}
