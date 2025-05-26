import { useCallback, useEffect, useRef, useState } from 'react';
import { batchedInvoke } from '../../../lib/tauri/batchedCommunication';

// Debounce helper – identical to useWorkspaceSearch
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
 * Hook wrapping the *content* trigram indexer (build_content_index / query_content_index).
 * API signature mirrors useWorkspaceSearch for drop-in replacement.
 */
export function useContentSearch(rootPath: string, query: string): SearchState {
  const PAGE_SIZE = 150;

  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(0);
  const requestIdRef = useRef(0);
  const builtRef = useRef(false);

  // Kick off index build once per root.
  useEffect(() => {
    if (!builtRef.current && rootPath) {
      builtRef.current = true;
      void batchedInvoke<number>('build_content_index', { path: rootPath }).catch((err) => {
        console.error('Failed to build content index', err);
      });
    }
  }, [rootPath]);

  const debouncedQuery = useDebouncedValue(query.trim(), 120);

  const fetchPage = useCallback(
    async (page: number) => {
      if (!rootPath) return;

      setLoading(true);
      const currentId = ++requestIdRef.current;

      try {
        const raw: string[] = await batchedInvoke('query_content_index', {
          path: rootPath,
          query: debouncedQuery,
          offset: page * PAGE_SIZE,
          limit: PAGE_SIZE,
        });

        if (currentId !== requestIdRef.current) return; // stale

        if (page === 0) {
          setResults(raw);
        } else {
          setResults((prev) => [...prev, ...raw]);
        }

        setHasMore(raw.length === PAGE_SIZE);
      } catch (err) {
        console.error('query_content_index failed', err);
      } finally {
        if (currentId === requestIdRef.current) setLoading(false);
      }
    },
    [rootPath, debouncedQuery]
  );

  // Reset + fetch first page when query/root changes
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
