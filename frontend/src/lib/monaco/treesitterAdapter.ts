// -----------------------------------------------------------------------------
// Monaco <-> Tree-sitter semantic tokens adapter
// -----------------------------------------------------------------------------
// Registers a DocumentSemanticTokensProvider that fetches tokens via the
// Tree-sitter bridge and converts them to Monaco's delta-encoded format.
// -----------------------------------------------------------------------------

import * as monaco from 'monaco-editor';
import type { SupportedLanguage } from '../../workers/treesitter/languages';
import { parseDocument } from '../treesitter/bridge';

const legend: monaco.languages.SemanticTokensLegend = {
  tokenTypes: ['variable'],
  tokenModifiers: [],
};

const registered = new Set<string>();

export function registerTreeSitter(lang: SupportedLanguage): void {
  if (registered.has(lang)) return;
  registered.add(lang);

  monaco.languages.registerDocumentSemanticTokensProvider(lang, {
    getLegend: () => legend,

    // Triggered when semantic tokens are requested (initial + refresh)
    async provideDocumentSemanticTokens(model, _lastResultId, _token) {
      const docId = model.uri.toString();
      const text = model.getValue();
      const tokens = await parseDocument(docId, lang, text);

      // Sort tokens by startIndex to ensure ascending order
      tokens.sort((a, b) => a.startIndex - b.startIndex);

      const data: number[] = [];
      let prevLine = 0;
      let prevChar = 0;

      for (const t of tokens) {
        const pos = model.getPositionAt(t.startIndex);
        const line = pos.lineNumber - 1; // Monaco lines are 1-based
        const char = pos.column - 1;
        const deltaLine = line - prevLine;
        const deltaChar = deltaLine === 0 ? char - prevChar : char;
        const length = t.length;
        const tokenType = 0; // single "variable" type for now
        const tokenMods = 0;

        data.push(deltaLine, deltaChar, length, tokenType, tokenMods);

        prevLine = line;
        prevChar = char;
      }

      return {
        data: new Uint32Array(data),
      };
    },

    releaseDocumentSemanticTokens() {
      /* no-op */
    },
  });
}
