// -----------------------------------------------------------------------------
// src/lib/monaco/loader.ts
// -----------------------------------------------------------------------------
// Centralised Monaco boot-strap utilities.
// Exposes:
//   • ensureLanguage(langId) – lazy-loads language contributions
//   • LARGE_FILE_THRESHOLD   – bytes; choose VirtualDocument above this size
//
// The design keeps Monaco’s heavy language bundles out of the main chunk.
// We rely on dynamic import() so Vite splits each language into its own file.
// The vite-plugin-monaco-editor plugin takes care of worker loader URLs.
// -----------------------------------------------------------------------------
/* eslint-disable @typescript-eslint/ban-ts-comment */

import type { TokenizationResult } from '@glass/monaco-tokenization';
import * as monaco from 'monaco-editor';
import { runTask } from '../../workers/pool/workerPool';

// ≈40 KiB on average after gzip – only load when needed.
const LANGUAGE_IMPORTS: Record<string, () => Promise<unknown>> = {
  typescript: () => import('monaco-editor/esm/vs/language/typescript/monaco.contribution'),
  javascript: () => import('monaco-editor/esm/vs/language/typescript/monaco.contribution'),
  json: () => import('monaco-editor/esm/vs/language/json/monaco.contribution'),
  css: () => import('monaco-editor/esm/vs/language/css/monaco.contribution'),
  html: () => import('monaco-editor/esm/vs/language/html/monaco.contribution'),
  markdown: () => import('monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution'),
};

const inflight: Record<string, Promise<void>> = {};

/**
 * Dynamically load Monaco language grammar & worker the first time we need it.
 */
export async function ensureLanguage(langId: string): Promise<void> {
  const id = langId.toLowerCase();
  if (!LANGUAGE_IMPORTS[id]) return; // unknown => use plaintext fallback
  if (!inflight[id]) {
    inflight[id] = LANGUAGE_IMPORTS[id]().then(() => void 0);
  }
  await inflight[id];
}

// -----------------------------------------------------------------------------
// Optional: register a very lightweight tokenizer that defers heavy lifting to
//           the existing WorkerPool. The built-in Monaco tokenisers already run
//           in dedicated workers, but this showcases custom off-thread work.
// -----------------------------------------------------------------------------
interface TokenizeLinePayload {
  lang: string;
  line: string;
}

const dummyState: monaco.languages.IState = {
  clone: () => dummyState,
  equals: () => true,
};

export function registerWorkerTokenizer(lang: string): void {
  if (monaco.languages.getEncodedLanguageId(lang) === 0) return; // language not registered

  monaco.languages.setTokensProvider(lang, {
    getInitialState: () => dummyState,
    tokenize: (line: string): TokenizationResult => {
      // Fire-and-forget – this keeps UI synchronous. Colourisation applies on
      // async callback update.
      runTask<string[]>('basicTokenizeLine', { lang, line } as TokenizeLinePayload).catch(() => []);
      return { tokens: [], endState: dummyState };
    },
  });
}

export const LARGE_FILE_THRESHOLD = 500_000; // 0.5 MiB – tweak as desired
