import { useEffect, useRef, useState } from 'react';
import { batchedInvoke } from '../../../lib/tauri/batchedCommunication';
import { runTask } from '../../../workers/pool/workerPool';

// Small debounce helper – waits `delay` ms after the last call before firing
function useDebouncedValue<T>(value: T, delay = 120): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface SearchState {
  results: string[];
  loading: boolean;
}

/**
 * Hook that wraps the workspace index search API.
 *
 * It lazily builds the index (once per mount) and debounces queries
 * to reduce IPC chatter.
 */
export function useWorkspaceSearch(rootPath: string, query: string): SearchState {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const builtRef = useRef(false);

  // Kick off index build once.
  useEffect(() => {
    if (!builtRef.current && rootPath) {
      builtRef.current = true;
      // Fire & forget – result not needed here
      void batchedInvoke<number>('build_index', { path: rootPath }).catch((err) => {
        console.error('Failed to build index', err);
      });
    }
  }, [rootPath]);

  // Debounce the query string to avoid rapid IPC calls while typing
  const debouncedQuery = useDebouncedValue(query.trim(), 120);

  useEffect(() => {
    let cancelled = false;
    if (!rootPath) return () => {};

    setLoading(true);
    void batchedInvoke<string[]>('query_index', { path: rootPath, query: debouncedQuery })
      .then(async (raw) => {
        // Results are already scored on backend – no need for extra worker fuzzy search
        if (!cancelled) setResults(raw);
      })
      .catch((err) => console.error('query_index failed', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rootPath, debouncedQuery]);

  return { results, loading };
}
