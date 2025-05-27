import { useCallback, useEffect, useRef, useState } from 'react';
import { batchedInvoke } from '../../../lib/tauri/batchedCommunication';
import { terminalLogger } from '../../../lib/tauri/consoleLogger';

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
      terminalLogger.log(`[CONTENT-SEARCH] Building content index for ${rootPath}`);
      void batchedInvoke<number>('build_content_index', { path: rootPath })
        .then((count) => {
          terminalLogger.log(
            `[CONTENT-SEARCH] Content index built with ${count} files for ${rootPath}`
          );
        })
        .catch((err) => {
          terminalLogger.log(`[CONTENT-SEARCH] Failed to build content index: ${err}`);
          console.error('Failed to build content index', err);
        });
    }
  }, [rootPath]);

  // Log the original and debounced queries to track what's happening
  const debouncedQuery = useDebouncedValue(query.trim(), 120);

  // Log when the debounced query changes
  useEffect(() => {
    terminalLogger.log(
      `[CONTENT-SEARCH] Debounced query updated: '${debouncedQuery}' (original: '${query.trim()}')`
    );
  }, [debouncedQuery, query]);

  const fetchPage = useCallback(
    async (page: number) => {
      if (!rootPath) return;

      setLoading(true);
      const currentId = ++requestIdRef.current;

      terminalLogger.log(
        `[CONTENT-SEARCH] Fetching page ${page} for content query: "${debouncedQuery}" in ${rootPath}`
      );
      const startTime = Date.now();

      try {
        // Log the exact structure of the API call
        terminalLogger.log(
          `[CONTENT-SEARCH] API call params: query='${debouncedQuery}', offset=${page * PAGE_SIZE}, limit=${PAGE_SIZE}`
        );

        // Check if we need to wrap params in a 'params' object like in useWorkspaceSearch
        // The backend expects parameters wrapped in a 'params' object
        const paramsObject = {
          params: {
            path: rootPath,
            query: debouncedQuery,
            offset: page * PAGE_SIZE,
            limit: PAGE_SIZE,
          },
        };

        terminalLogger.log(
          `[CONTENT-SEARCH] Calling query_content_index with params: ${JSON.stringify(paramsObject)}`
        );
        const raw: string[] = await batchedInvoke('query_content_index', paramsObject);

        if (currentId !== requestIdRef.current) {
          terminalLogger.log(
            `[CONTENT-SEARCH] Ignoring stale response for query: "${debouncedQuery}"`
          );
          return; // stale
        }

        const queryTime = Date.now() - startTime;
        terminalLogger.log(`[CONTENT-SEARCH] Query execution time: ${queryTime}ms (page ${page})`);
        terminalLogger.log(`[CONTENT-SEARCH] Raw results received: ${raw.length} items`);

        if (raw.length > 0) {
          terminalLogger.log(`[CONTENT-SEARCH] Result sample: ${raw.slice(0, 3).join(', ')}`);
        }

        if (page === 0) {
          terminalLogger.log(`[CONTENT-SEARCH] Setting initial results: ${raw.length} items`);
          setResults(raw);
        } else {
          terminalLogger.log(
            `[CONTENT-SEARCH] Appending ${raw.length} items to existing ${results.length} results`
          );
          setResults((prev) => [...prev, ...raw]);
        }

        const moreAvailable = raw.length === PAGE_SIZE;
        terminalLogger.log(`[CONTENT-SEARCH] Has more results: ${moreAvailable}`);
        setHasMore(moreAvailable);
      } catch (err) {
        terminalLogger.log(`[CONTENT-SEARCH] Query failed: ${err}`);
        console.error('query_content_index failed', err);
      } finally {
        if (currentId === requestIdRef.current) {
          terminalLogger.log('[CONTENT-SEARCH] Search complete, updating loading state');
          setLoading(false);
        }
      }
    },
    [rootPath, debouncedQuery, results.length]
  );

  // Reset + fetch first page when query/root changes
  useEffect(() => {
    pageRef.current = 0;
    setResults([]);
    setHasMore(false);

    // Always log the decision whether to fetch or not
    if (!rootPath) {
      terminalLogger.log('[CONTENT-SEARCH] No root path, skipping search');
      return;
    }

    if (!debouncedQuery) {
      terminalLogger.log('[CONTENT-SEARCH] Empty debounced query, skipping content search');
      // Even with empty query, we could initialize some results (like in workspace search)
      // For testing, let's log this condition but still proceed with search
      terminalLogger.log('[CONTENT-SEARCH] TEST: Attempting search with empty query anyway');
      fetchPage(0);
      return;
    }

    terminalLogger.log(`[CONTENT-SEARCH] Initiating search with query: '${debouncedQuery}'`);
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
