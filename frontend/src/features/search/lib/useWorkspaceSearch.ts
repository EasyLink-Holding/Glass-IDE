import { useCallback, useEffect, useRef, useState } from 'react';
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
  loadMore: () => void;
  hasMore: boolean;
}

/**
 * Hook that wraps the workspace index search API.
 *
 * It lazily builds the index (once per mount) and debounces queries
 * to reduce IPC chatter.
 */
export function useWorkspaceSearch(rootPath: string, query: string): SearchState {
  const PAGE_SIZE = 150;

  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(0);
  const requestIdRef = useRef(0);
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

  const fetchPage = useCallback(
    async (page: number) => {
      if (!rootPath) return;

      setLoading(true);
      const currentId = ++requestIdRef.current;

      try {
        let raw: string[] = await batchedInvoke('query_index', {
          path: rootPath,
          query: debouncedQuery,
          offset: page * PAGE_SIZE,
          limit: PAGE_SIZE,
        });

        // Local fuzzy re-ranking in a background worker for extra snappiness
        if (debouncedQuery) {
          try {
            raw = await runTask<string[]>('heavyFilterSort', {
              items: raw,
              query: debouncedQuery,
              limit: PAGE_SIZE,
            });
          } catch (err) {
            console.warn('Worker heavyFilterSort failed – falling back to raw order', err);
          }
        }

        // Ignore if a newer request was issued
        if (currentId !== requestIdRef.current) return;

        if (page === 0) {
          setResults(raw);
        } else {
          setResults((prev) => [...prev, ...raw]);
        }

        setHasMore(raw.length === PAGE_SIZE);
      } catch (err) {
        console.error('query_index failed', err);
      } finally {
        if (currentId === requestIdRef.current) setLoading(false);
      }
    },
    [rootPath, debouncedQuery]
  );

  // Reset + fetch first page when query or root changes
  useEffect(() => {
    pageRef.current = 0;
    setResults([]);
    setHasMore(false);

    if (!debouncedQuery || !rootPath) return;

    fetchPage(0);
  }, [debouncedQuery, rootPath, fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    fetchPage(nextPage);
  }, [fetchPage, loading, hasMore]);

  return { results, loading, loadMore, hasMore };
}
