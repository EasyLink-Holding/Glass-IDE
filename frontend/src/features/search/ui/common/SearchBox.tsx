import { useEffect, useMemo, useState } from 'react';
import { terminalLogger } from '../../../../lib/tauri/consoleLogger';
import { useWorkspaceRoot } from '../../../../lib/workspace/workspaceStore';
import { debugDirectSearch } from '../../lib/debugSearch';
import { useContentSearch } from '../../lib/useContentSearch';
import { useWorkspaceSearch } from '../../lib/useWorkspaceSearch';
import { SearchResultsDropdown } from '../SearchResultsDropdown';

interface Props {
  open: boolean;
  query: string;
}

/**
 * Detached rounded card that will contain search results.
 * Currently empty; appears below the search bar when `open` is true.
 */
export default function SearchDropdown({ open, query }: Props) {
  const root = useWorkspaceRoot();

  // Log important state for debugging
  useEffect(() => {
    terminalLogger.log(
      `[SEARCH-UI] SearchDropdown state: open=${open}, root=${root || 'null'}, query="${query}"`
    );

    // When the search dropdown is opened and we have a workspace, run a direct debug search
    if (open && root) {
      // Run direct search debug to test if search is working correctly
      void debugDirectSearch(root);
    }
  }, [open, root, query]);

  // Detect content-search mode when query starts with '>'
  const trimmed = useMemo(() => query.trim(), [query]);
  const contentMode = trimmed.startsWith('>');
  const actualQuery = contentMode ? trimmed.slice(1) : trimmed;

  useEffect(() => {
    if (open && root) {
      terminalLogger.log(
        `[SEARCH-UI] Search mode: ${contentMode ? 'Content' : 'Workspace'}, ` +
          `Original query: "${query}", Trimmed: "${trimmed}", Processed: "${actualQuery}"`
      );
    }
  }, [open, root, contentMode, actualQuery, query, trimmed]);

  // Log when content mode changes
  useEffect(() => {
    if (contentMode) {
      terminalLogger.log(`[SEARCH-UI] Content search mode activated with query: "${actualQuery}"`);
    }
  }, [contentMode, actualQuery]);

  // Call both hooks unconditionally to satisfy React Rules of Hooks
  const wsHook = useWorkspaceSearch(root ?? '', actualQuery);
  const ctHook = useContentSearch(root ?? '', actualQuery);
  const { results, loading, loadMore, hasMore } = contentMode ? ctHook : wsHook;
  const [collapsed, setCollapsed] = useState(true);

  // Log results changes
  useEffect(() => {
    if (open && root) {
      terminalLogger.log(
        `[SEARCH-UI] Results updated: ${results.length} items, loading=${loading}, hasMore=${hasMore}`
      );
    }
  }, [open, root, results, loading, hasMore]);

  // Track collapsed state changes
  useEffect(() => {
    if (open && root) {
      terminalLogger.log(`[SEARCH-UI] Collapsed state changed to: ${collapsed}`);
    }
  }, [open, root, collapsed]);

  // Don't reset collapsed state on empty query as this prevents the "See more" functionality
  // Remove: if (!query && !collapsed) setCollapsed(true);

  if (!open) return null;

  if (!root) {
    return (
      <div className="rounded border border-neutral-700 bg-neutral-800/60 p-4 text-sm text-neutral-400">
        Open a workspace to enable search.
      </div>
    );
  }

  // Add extra logging right before rendering
  terminalLogger.log(
    `[SEARCH-UI] Rendering dropdown with data: resultCount=${results.length}, loading=${loading}, hasMore=${hasMore}, collapsed=${collapsed}`
  );
  if (results.length > 0) {
    terminalLogger.log(`[SEARCH-UI] Sample results: ${results.slice(0, 3).join(', ')}`);
  }

  return (
    <SearchResultsDropdown
      results={results}
      loading={loading}
      hasMore={hasMore}
      collapsed={collapsed}
      onExpand={(e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();

        // If we were collapsed, first un-collapse; otherwise load next page
        if (collapsed) {
          setCollapsed(false);
        } else {
          loadMore();
        }
      }}
      onSelect={() => {
        /* no-op until file open implemented */
      }}
    />
  );
}
