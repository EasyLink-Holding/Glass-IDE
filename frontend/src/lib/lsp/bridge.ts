import { invoke } from '@tauri-apps/api/core';
import * as monaco from 'monaco-editor';

/** Internal helper to access a private cache of registered providers without
 *  resorting to `any`. We augment the `languages` namespace with an optional
 *  `_providers` map keyed by our custom IDs.
 */
type MutableLanguages = typeof monaco.languages & {
  _providers?: Record<string, monaco.IDisposable>;
};

/** Minimal LSP → Monaco adapter (request/response only, no notifications).
 *  It wires basic completion support by forwarding `textDocument/completion`.
 */
export async function setupLspBridge(workspaceRoot: string, language: string) {
  // Guard: do not re-register multiple providers for same language
  const providerKey = `glass-lsp-${language}`;
  const languagesMutable = monaco.languages as MutableLanguages;
  if (languagesMutable._providers?.[providerKey]) return;

  const completionProvider = monaco.languages.registerCompletionItemProvider(language, {
    triggerCharacters: ['.', ':', '<', '"', "'", '/'],

    async provideCompletionItems(model, position) {
      try {
        const params = {
          textDocument: { uri: model.uri.toString() },
          position: { line: position.lineNumber - 1, character: position.column - 1 },
          context: { triggerKind: 1 },
        };

        const request = {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'textDocument/completion',
          params,
        };

        const resp: { response: { result?: unknown } } = await invoke('invoke_lsp', {
          root: workspaceRoot,
          request,
        });

        const lspResult = resp?.response?.result as
          | { items?: LspCompletionItem[] }
          | LspCompletionItem[]
          | undefined;
        if (!lspResult) return { suggestions: [] };

        const items: LspCompletionItem[] = Array.isArray(lspResult)
          ? lspResult
          : (lspResult.items ?? []);
        const suggestions = items.map(mapLspItemToMonaco);
        return { suggestions };
      } catch (err) {
        console.error('[LSP completion error]', err);
        return { suggestions: [] };
      }
    },
  });

  // Persist provider reference so we don't double-register next time.
  languagesMutable._providers = {
    ...languagesMutable._providers,
    [providerKey]: completionProvider,
  };
}

interface LspCompletionItem {
  label: string;
  kind?: number;
  insertText?: string;
}

function mapLspItemToMonaco(item: LspCompletionItem): monaco.languages.CompletionItem {
  return {
    label: item.label,
    kind: lspKindToMonaco(item.kind),
    insertText: item.insertText ?? item.label,
    // Let Monaco compute the insertion range automatically.
  } as monaco.languages.CompletionItem;
}

function lspKindToMonaco(kind: number | undefined): monaco.languages.CompletionItemKind {
  // basic mapping subset
  switch (kind) {
    case 2:
      return monaco.languages.CompletionItemKind.Function;
    case 3:
      return monaco.languages.CompletionItemKind.Constructor;
    case 4:
      return monaco.languages.CompletionItemKind.Field;
    case 5:
      return monaco.languages.CompletionItemKind.Variable;
    case 6:
      return monaco.languages.CompletionItemKind.Class;
    default:
      return monaco.languages.CompletionItemKind.Text;
  }
}
