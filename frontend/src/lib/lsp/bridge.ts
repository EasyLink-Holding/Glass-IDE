import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
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
  const completionKey = `glass-lsp-${language}-completion`;
  const hoverKey = `glass-lsp-${language}-hover`;
  const languagesMutable = monaco.languages as MutableLanguages;
  // Already registered?
  if (languagesMutable._providers?.[completionKey] && languagesMutable._providers?.[hoverKey])
    return;

  // ------------------------ Completion Provider ----------------------------
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

  // --------------------------- Hover Provider ------------------------------
  const hoverProvider = monaco.languages.registerHoverProvider(language, {
    async provideHover(model, position) {
      try {
        const params = {
          textDocument: { uri: model.uri.toString() },
          position: { line: position.lineNumber - 1, character: position.column - 1 },
        };

        const request = {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'textDocument/hover',
          params,
        };

        const resp: { response: { result?: LspHover | null } } = await invoke('invoke_lsp', {
          root: workspaceRoot,
          request,
        });

        const result = resp.response.result;
        if (!result || !result.contents) return { contents: [] };

        const contents = hoverContentsToMarkdown(result.contents);
        return {
          contents: [{ value: contents }],
        } as monaco.languages.Hover;
      } catch (err) {
        console.error('[LSP hover error]', err);
        return { contents: [] };
      }
    },
  });

  languagesMutable._providers = {
    ...languagesMutable._providers,
    [completionKey]: completionProvider,
    [hoverKey]: hoverProvider,
  };

  // ----------------------- Diagnostics Listener ---------------------------
  initDiagnosticsListener();
}

// Singleton init guard
let diagnosticsInitialized = false;

function initDiagnosticsListener() {
  if (diagnosticsInitialized) return;
  diagnosticsInitialized = true;

  // Fire-and-forget promise
  void listen<LspDiagnosticsPayload>('lsp_diagnostics', (event) => {
    const { uri, diagnostics } = event.payload;
    const model = monaco.editor.getModel(monaco.Uri.parse(uri));
    if (!model) return;

    const markers = diagnostics.map((d) => ({
      severity: lspSeverityToMonaco(d.severity),
      message: d.message,
      source: d.source,
      startLineNumber: d.range.start.line + 1,
      startColumn: d.range.start.character + 1,
      endLineNumber: d.range.end.line + 1,
      endColumn: d.range.end.character + 1,
    }));

    monaco.editor.setModelMarkers(model, 'lsp', markers);
  });
}

function lspSeverityToMonaco(sev: number | undefined): monaco.MarkerSeverity {
  switch (sev) {
    case 1:
      return monaco.MarkerSeverity.Error;
    case 2:
      return monaco.MarkerSeverity.Warning;
    case 3:
      return monaco.MarkerSeverity.Info;
    case 4:
      return monaco.MarkerSeverity.Hint;
    default:
      return monaco.MarkerSeverity.Info;
  }
}

// --------------------------------- Types -----------------------------------
interface LspCompletionItem {
  label: string;
  kind?: number;
  insertText?: string;
}

interface LspPosition {
  line: number;
  character: number;
}

interface LspRange {
  start: LspPosition;
  end: LspPosition;
}

interface LspDiagnostic {
  range: LspRange;
  message: string;
  severity?: number;
  source?: string;
}

interface LspDiagnosticsPayload {
  uri: string;
  diagnostics: LspDiagnostic[];
}

type LspMarkupContent = { kind: 'markdown' | 'plaintext'; value: string };
type LspMarkedString = string | { language: string; value: string };

interface LspHover {
  contents: LspMarkupContent | LspMarkupContent[] | LspMarkedString | LspMarkedString[];
}

// Convert various LSP hover content representations to markdown string
function hoverContentsToMarkdown(contents: LspHover['contents']): string {
  const arr = Array.isArray(contents) ? contents : [contents];
  return arr
    .map((c) => {
      if (typeof c === 'string') return c;
      if ('kind' in c) return c.value; // MarkupContent
      // MarkedString
      return `\`\`\`${c.language}\n${c.value}\n\`\`\``;
    })
    .join('\n\n');
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
