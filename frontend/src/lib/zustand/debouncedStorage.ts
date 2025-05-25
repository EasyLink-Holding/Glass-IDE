// Lightweight debounced wrapper around Web Storage for Zustand persist
// -----------------------------------------------------------------------------
// Problem: `zustand/middleware` `persist()` writes to `localStorage` on *every*
// `set()` call which can lead to dozens of synchronous `setItem()` per second,
// blocking the main thread when the UI is busy (typing, drags, etc.).
//
// Solution: provide a custom `StateStorage` implementation whose `setItem` is
// debounced. All writes within the given delay window are batched into a single
// `setItem` call, significantly reducing main-thread churn.
// -----------------------------------------------------------------------------

import type { StateStorage } from 'zustand/middleware';

/**
 * Create a debounced JSON storage compatible with `persist()`.
 *
 * @param base  Underlying storage (defaults to `window.localStorage`).
 * @param delay Debounce window in ms (default 300ms).
 */
export function createDebouncedJSONStorage(
  base: Storage = typeof window === 'undefined' ? ({} as Storage) : window.localStorage,
  delay = 300
): StateStorage {
  // Queue of key/value pairs waiting to be flushed
  const queue = new Map<string, string>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  /** Flush queued writes */
  const flush = () => {
    for (const [key, value] of queue) {
      try {
        base.setItem(key, value);
      } catch (err) {
        // Ignore quota / security errors – do not crash the app
        console.warn('glass-ide: failed to persist state', err);
      }
    }
    queue.clear();
    timer = null;
  };

  return {
    getItem: (name) => {
      try {
        return base.getItem(name);
      } catch {
        return null;
      }
    },
    // Per StateStorage contract, value is a JSON string produced by persist's serializer
    setItem: (name, value: string) => {
      queue.set(name, value);
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, delay);
    },
    removeItem: (name) => {
      queue.delete(name);
      try {
        base.removeItem(name);
      } catch {
        /* noop */
      }
    },
  };
}
