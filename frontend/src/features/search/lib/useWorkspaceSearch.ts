import { useCallback, useEffect, useRef, useState } from 'react';
import { batchedInvoke } from '../../../lib/tauri/batchedCommunication';
import { terminalLogger } from '../../../lib/tauri/consoleLogger';
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
      terminalLogger.log(`[SEARCH] Initiating index build for workspace: ${rootPath}`);
      builtRef.current = true;
      // Fire & forget – result not needed here
      void batchedInvoke<number>('build_index', { path: rootPath })
        .then((numFiles) => {
          terminalLogger.log(
            `[SEARCH] Index build completed for ${rootPath}: ${numFiles} files indexed`
          );
        })
        .catch((err) => {
          terminalLogger.error('[SEARCH] Failed to build index', err);
        });
    } else if (!rootPath) {
      terminalLogger.log('[SEARCH] No workspace root provided, skipping index build');
    } else if (builtRef.current) {
      terminalLogger.log('[SEARCH] Index already built for this session, skipping');
    }
  }, [rootPath]);

  // Debounce the query string to avoid rapid IPC calls while typing
  const debouncedQuery = useDebouncedValue(query.trim(), 120);

  const fetchPage = useCallback(
    async (page: number) => {
      if (!rootPath) {
        terminalLogger.log('[SEARCH] Cannot fetch results: No workspace root provided');
        return;
      }

      terminalLogger.log(
        `[SEARCH] Fetching page ${page} for query: "${debouncedQuery}" in ${rootPath}`
      );
      setLoading(true);
      const currentId = ++requestIdRef.current;

      try {
        const startTime = Date.now();
        terminalLogger.log(`[SEARCH] Starting query execution (page ${page})`);
        let raw: string[] = await batchedInvoke('query_index', {
          params: {
            path: rootPath,
            query: debouncedQuery,
            offset: page * PAGE_SIZE,
            limit: PAGE_SIZE,
          },
        });
        const duration = Date.now() - startTime;
        terminalLogger.log(`[SEARCH] Query execution time: ${duration}ms (page ${page})`);
        terminalLogger.log(`[SEARCH] Raw results received: ${raw.length} items`);

        // Detailed logging of received data
        if (raw.length > 0) {
          terminalLogger.log(`[SEARCH] Result sample: ${raw.slice(0, 3).join(', ')}`);
        } else {
          terminalLogger.warn('[SEARCH] Warning: Empty results array received from backend');
          terminalLogger.log(`[SEARCH] Debug info - Query: "${debouncedQuery}", Path: ${rootPath}`);
        }

        // Local fuzzy re-ranking in a background worker for extra snappiness
        if (debouncedQuery) {
          try {
            const rankStart = Date.now();
            terminalLogger.log('[SEARCH] Starting client-side re-ranking');
            raw = await runTask<string[]>('heavyFilterSort', {
              items: raw,
              query: debouncedQuery,
              limit: PAGE_SIZE,
            });
            terminalLogger.log(
              `[SEARCH] Client-side re-ranking completed in ${Date.now() - rankStart}ms`
            );
          } catch (err) {
            terminalLogger.warn(
              '[SEARCH] Worker heavyFilterSort failed – falling back to raw order',
              err
            );
          }
        }

        // Ignore if a newer request was issued
        if (currentId !== requestIdRef.current) {
          terminalLogger.log('[SEARCH] Request superseded by newer query, discarding results');
          return;
        }

        if (page === 0) {
          terminalLogger.log(`[SEARCH] Setting initial results: ${raw.length} items`);
          setResults(raw);
        } else {
          terminalLogger.log(`[SEARCH] Appending page ${page} results: ${raw.length} items`);
          setResults((prev) => [...prev, ...raw]);
        }

        const hasMoreItems = raw.length === PAGE_SIZE;
        terminalLogger.log(`[SEARCH] Has more results: ${hasMoreItems}`);
        setHasMore(hasMoreItems);
      } catch (err) {
        terminalLogger.error('[SEARCH] query_index failed', err);
      } finally {
        if (currentId === requestIdRef.current) {
          terminalLogger.log('[SEARCH] Search complete, updating loading state');
          setLoading(false);
        }
      }
    },
    [rootPath, debouncedQuery]
  );

  // Reset + fetch first page when query or root changes
  useEffect(() => {
    terminalLogger.log(
      `[SEARCH] Query or root changed - Query: "${debouncedQuery}", Root: ${rootPath}`
    );
    pageRef.current = 0;
    setResults([]);
    setHasMore(false);

    // We need the root path, but empty query is ok for initial results
    if (!rootPath) {
      terminalLogger.log('[SEARCH] Skipping search - no workspace root');
      return;
    }

    // Always perform a search even with empty query to show initial results
    terminalLogger.log('[SEARCH] Triggering initial search');
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
