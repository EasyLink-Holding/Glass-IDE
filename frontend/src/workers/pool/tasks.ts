/*
 * Task implementations that can run inside the WorkerPool.
 * Add new heavy / CPU-bound utilities here and expose them by name.
 */

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

// Map of exposed task names -> function
export const taskRegistry: Record<string, (payload: unknown) => unknown> = {
  deterministicStringify: (p) => deterministicStringify(p as Record<string, unknown>),
  fuzzySearch: (p) => fuzzySearch(p as FuzzySearchPayload),
};

// Dynamic key union type for tasks
export type TaskName = keyof typeof taskRegistry;
