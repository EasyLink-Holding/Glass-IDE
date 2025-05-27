// -----------------------------------------------------------------------------
// Tree-sitter bridge – runs on the main thread and talks to parser workers.
// -----------------------------------------------------------------------------
// This helper hides the Worker plumbing behind a simple Promise-based API:
//   • parseDocument(docId, lang, text)  → semantic tokens for initial text
//   • requestTokens(docId, lang)        → latest semantic tokens snapshot
//   • applyEdits(docId, lang, edits)    → incremental edits (no Promise)
//
// Workers are created lazily *per language* and cached. A single worker can
// maintain multiple document trees because the messages include a docId.
// -----------------------------------------------------------------------------

import type { SupportedLanguage } from '../../workers/treesitter/languages';

// ------------------------------ Types ---------------------------------------

export interface Token {
  startIndex: number;
  length: number;
  scope: string;
}

interface ParseReq {
  type: 'parse';
  docId: string;
  language: SupportedLanguage;
  text: string;
}
interface Edit {
  startIndex: number;
  oldEndIndex: number;
  newEndIndex: number;
  text: string;
}
interface EditReq {
  type: 'edit';
  docId: string;
  edits: Edit[];
}
interface QueryReq {
  type: 'query';
  docId: string;
  queryType: 'tokens';
}

// Union requests & responses
type WorkerReq = ParseReq | EditReq | QueryReq;

type WorkerResp =
  | { type: 'tokens'; docId: string; data: Token[] }
  | { type: 'parsed'; docId: string };

// ----------------------------- internals ------------------------------------

const workerCache: Map<string, Worker> = new Map(); // lang → Worker

function getWorker(lang: SupportedLanguage): Worker {
  let w = workerCache.get(lang);
  if (!w) {
    // NOTE: path is resolved relative to this file at build time by Vite.
    w = new Worker(new URL('../../workers/treesitter/parserWorker.ts', import.meta.url), {
      type: 'module',
    });
    workerCache.set(lang, w);
  }
  return w;
}

// Helper that waits for a single matching message then resolves.
function waitFor<T extends WorkerResp>(
  worker: Worker,
  predicate: (msg: WorkerResp) => msg is T
): Promise<T> {
  return new Promise((resolve) => {
    const handler = (ev: MessageEvent<WorkerResp>) => {
      const data = ev.data;
      if (predicate(data)) {
        worker.removeEventListener('message', handler);
        resolve(data);
      }
    };
    worker.addEventListener('message', handler);
  });
}

// ------------------------------- Public API ---------------------------------

/**
 * Parse *full* document text and return semantic tokens.
 */
export function parseDocument(
  docId: string,
  language: SupportedLanguage,
  text: string
): Promise<Token[]> {
  const worker = getWorker(language);
  worker.postMessage({ type: 'parse', docId, language, text } as ParseReq satisfies WorkerReq);
  return waitFor(worker, (d): d is Extract<WorkerResp, { type: 'tokens' }> => {
    return d.type === 'tokens' && d.docId === docId;
  }).then((msg) => msg.data);
}

/**
 * Request latest tokens snapshot (fast, no reparse).
 */
export function requestTokens(docId: string, language: SupportedLanguage): Promise<Token[]> {
  const worker = getWorker(language);
  worker.postMessage({ type: 'query', docId, queryType: 'tokens' } as QueryReq satisfies WorkerReq);
  return waitFor(worker, (d): d is Extract<WorkerResp, { type: 'tokens' }> => {
    return d.type === 'tokens' && d.docId === docId;
  }).then((msg) => msg.data);
}

/**
 * Apply incremental edits to previously-parsed document. Call this from
 * Monaco's `onDidChangeModelContent` with translated Tree-sitter edit ranges.
 * (No Promise returned – host can call requestTokens afterwards if needed.)
 */
export function applyEdits(docId: string, language: SupportedLanguage, edits: Edit[]): void {
  if (!edits.length) return;
  const worker = getWorker(language);
  worker.postMessage({ type: 'edit', docId, edits } as EditReq satisfies WorkerReq);
}
