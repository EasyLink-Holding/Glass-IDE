/*
 * Task implementations that can run inside the WorkerPool.
 * Add new heavy / CPU-bound utilities here and expose them by name.
 */

import jsonpatch from 'fast-json-patch';
import type { Operation } from 'fast-json-patch';
import MarkdownIt from 'markdown-it';
import type { Options as MarkdownItOptions } from 'markdown-it';

export function deterministicStringify(obj: Record<string, unknown>): string {
  const visited = new WeakSet();

  function sortObjectKeys(input: unknown, depth = 0): unknown {
    if (depth > 100) return '[MAX_DEPTH_EXCEEDED]';

    if (input === null) return null;
    if (typeof input !== 'object') {
      if (typeof input === 'function') return '[Function]';
      if (typeof input === 'symbol') return '[Symbol]';
      if (typeof input === 'undefined') return null;
      if (typeof input === 'number' && (Number.isNaN(input) || !Number.isFinite(input)))
        return null;
      return input;
    }

    if (visited.has(input)) return '[Circular]';
    visited.add(input as object);

    if (Array.isArray(input)) return input.map((i) => sortObjectKeys(i, depth + 1));
    if (input instanceof Date) return input.toISOString();
    if (input instanceof RegExp) return input.toString();
    if (input instanceof Map || input instanceof Set) return `[${input.constructor.name}]`;

    const sortedKeys = Object.keys(input).sort();
    const out: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      out[key] = sortObjectKeys((input as Record<string, unknown>)[key], depth + 1);
    }
    return out;
  }

  try {
    return JSON.stringify(sortObjectKeys(obj));
  } catch {
    return JSON.stringify({ error: 'Unstringifiable object' });
  }
}

// -----------------------------------------------------------------------------
// Simple fuzzy search scoring – runs inside WorkerPool
// -----------------------------------------------------------------------------
interface FuzzySearchPayload {
  items: string[];
  query: string;
  /** Max items to return */
  limit?: number;
}

/** Lightweight subsequence-based fuzzy matcher (dependency-free). */
export function fuzzySearch({ items, query, limit = 100 }: FuzzySearchPayload): string[] {
  if (!query) return items.slice(0, limit);

  const qLower = query.toLowerCase();

  // Basic scoring: subsequence matches plus bonus for consecutive chars
  const scoreItem = (input: string): number => {
    const sLower = input.toLowerCase();
    let score = 0;
    let lastMatchIdx = -1;

    for (let qi = 0; qi < qLower.length; qi++) {
      const ch = qLower[qi];
      const idx = sLower.indexOf(ch, lastMatchIdx + 1);
      if (idx === -1) return 0; // bail if any char not found
      // bonus for consecutive characters
      score += idx === lastMatchIdx + 1 ? 2 : 1;
      lastMatchIdx = idx;
    }
    return score;
  };

  return items
    .map((item) => ({ item, s: scoreItem(item) }))
    .filter((o) => o.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((o) => o.item);
}

// -----------------------------------------------------------------------------
// Generic heavy filter + sort helper – runs inside WorkerPool
// -----------------------------------------------------------------------------
interface HeavyFilterSortPayload {
  items: string[];
  /** Case-insensitive substring to filter by */
  query: string;
  /** Maximum number of items to return */
  limit?: number;
}

/**
 * Filters `items` to those containing `query` (case-insensitive) and sorts by:
 *   1) Position of the match (earlier is better)
 *   2) Shorter length first
 *   3) Lexicographic (locale-aware)
 *
 * Intended for large lists (e.g. workspace file paths) where a simple
 * substring match is sufficient and full fuzzy scoring is overkill.
 */
export function heavyFilterSort({ items, query, limit = 100 }: HeavyFilterSortPayload): string[] {
  if (!query) return items.slice(0, limit);

  const qLower = query.toLowerCase();

  return items
    .filter((s) => s.toLowerCase().includes(qLower))
    .sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const idxA = aLower.indexOf(qLower);
      const idxB = bLower.indexOf(qLower);
      if (idxA !== idxB) return idxA - idxB; // earlier match first
      if (a.length !== b.length) return a.length - b.length; // shorter first
      return a.localeCompare(b);
    })
    .slice(0, limit);
}

// -----------------------------------------------------------------------------
// Markdown → HTML renderer – offloaded to worker
// -----------------------------------------------------------------------------
interface MdToHtmlPayload {
  markdown: string;
  /** Optional markdown-it options override */
  opts?: MarkdownItOptions;
}

// Instantiate a single MarkdownIt instance per worker – heavy to create.
const mdParser = new MarkdownIt({ linkify: true, html: false });

export function mdToHtml({ markdown, opts }: MdToHtmlPayload): string {
  if (opts) {
    mdParser.set(opts);
  }
  return mdParser.render(markdown || '');
}

// -----------------------------------------------------------------------------
// JSON diff generator – returns RFC 6902 patch
// -----------------------------------------------------------------------------
interface JsonDiffPayload {
  oldObj: unknown;
  newObj: unknown;
}

export function jsonDiff({ oldObj, newObj }: JsonDiffPayload): Operation[] {
  return (jsonpatch as { compare(a: unknown, b: unknown): Operation[] }).compare(oldObj, newObj);
}

// Map of exposed task names -> function
export const taskRegistry: Record<string, (payload: unknown) => unknown> = {
  deterministicStringify: (p) => deterministicStringify(p as Record<string, unknown>),
  fuzzySearch: (p) => fuzzySearch(p as FuzzySearchPayload),
  heavyFilterSort: (p) => heavyFilterSort(p as HeavyFilterSortPayload),
  mdToHtml: (p) => mdToHtml(p as MdToHtmlPayload),
  jsonDiff: (p) => jsonDiff(p as JsonDiffPayload),
};

// Dynamic key union type for tasks
export type TaskName = keyof typeof taskRegistry;
