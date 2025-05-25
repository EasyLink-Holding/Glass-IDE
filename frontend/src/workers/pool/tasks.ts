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

// Map of exposed task names -> function
export const taskRegistry: Record<string, (payload: unknown) => unknown> = {
  deterministicStringify: (p) => deterministicStringify(p as Record<string, unknown>),
};

// Dynamic key union type for tasks
export type TaskName = keyof typeof taskRegistry;
