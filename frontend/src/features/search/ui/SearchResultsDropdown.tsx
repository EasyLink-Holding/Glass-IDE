import { memo, useCallback, useEffect, useMemo } from 'react';
import { VirtualList } from '../../../components/ui/virtual/VirtualList';
import { terminalLogger } from '../../../lib/tauri/consoleLogger';

interface Props {
  results: string[];
  onSelect: (path: string) => void;
  loading?: boolean;
  collapsed?: boolean;
  showCount?: number;
  onExpand?: () => void; // called when user clicks footer button
  hasMore?: boolean; // more pages available
}

function SearchResultsDropdownInner({
  results,
  onSelect,
  loading,
  collapsed = false,
  showCount = 5,
  onExpand,
  hasMore,
}: Props) {
  // Debug logging
  useEffect(() => {
    terminalLogger.log(
      `[SEARCH-RESULTS] Rendering dropdown: ${results.length} results, loading=${loading}, collapsed=${collapsed}`
    );
  }, [results.length, loading, collapsed]);

  // Debug when collapsed state changes
  useEffect(() => {
    terminalLogger.log(`[SEARCH-RESULTS] Collapsed state changed: ${collapsed}`);
  }, [collapsed]);

  // Always show something when the dropdown is opened
  // if (!results.length && !loading) return null;
  // Memo to avoid recomputing slices on each render if inputs unchanged
  const displayResults = useCallback(() => {
    // Show loading placeholders when loading
    if (loading) {
      return Array(showCount)
        .fill('')
        .map((_, i) => `loading-${i}`);
    }

    // Show limited results when collapsed, all results when expanded
    const itemsToShow = collapsed ? showCount : results.length;
    terminalLogger.log(
      `[SEARCH-RESULTS] Showing ${itemsToShow} of ${results.length} items (collapsed=${collapsed})`
    );
    return results.slice(0, itemsToShow);
  }, [loading, results, collapsed, showCount]);

  // Get the actual items to display
  const items = useMemo(() => displayResults(), [displayResults]);

  // Log important state changes for debugging
  useEffect(() => {
    terminalLogger.log(
      `[SEARCH-RESULTS] Display state: collapsed=${collapsed}, results=${results.length}, showing=${items.length}`
    );
  }, [collapsed, results.length, items.length]);

  // Debug logging
  useEffect(() => {
    terminalLogger.log(`[SEARCH-RESULTS] Display items: ${items.length} items to show`);
    if (items.length > 0) {
      terminalLogger.log(`[SEARCH-RESULTS] First few items: ${items.slice(0, 3).join(', ')}`);
    } else {
      terminalLogger.log('[SEARCH-RESULTS] No items to display');
    }
  }, [items]);

  // When collapsed, height is based on actual items (max 5)
  // When expanded, set a reasonable max height based on items with scrolling
  const MAX_COLLAPSED_ITEMS = 5;
  const ITEM_HEIGHT = 28;
  const MAX_EXPANDED_HEIGHT = 300;

  const collapsedHeight = Math.min(items.length, MAX_COLLAPSED_ITEMS) * ITEM_HEIGHT;
  const expandedHeight = Math.min(items.length * ITEM_HEIGHT, MAX_EXPANDED_HEIGHT);
  const height = collapsed ? collapsedHeight : expandedHeight;

  // Additional logging for height calculation
  useEffect(() => {
    terminalLogger.log(
      `[SEARCH-RESULTS] Height calculation: items=${items.length}, collapsed=${collapsed}, ` +
        `height=${height}px (${collapsed ? 'collapsed' : 'expanded'})`
    );
  }, [items.length, collapsed, height]);

  return (
    <div className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-neutral-600 bg-neutral-800/90 shadow-lg backdrop-blur">
      <VirtualList
        items={items}
        itemSize={28}
        height={height}
        render={(item: string) => (
          <button
            type="button"
            disabled={loading}
            className="flex w-full items-center gap-2 truncate px-3 text-left text-sm text-neutral-200 hover:bg-neutral-700/50 disabled:cursor-wait"
            onClick={() => !loading && onSelect(item)}
          >
            {loading ? (
              <div className="h-4 w-full animate-pulse rounded bg-neutral-600" />
            ) : (
              <span className="truncate font-mono">{item}</span>
            )}
          </button>
        )}
      />
      {(collapsed || hasMore) && !loading && results.length > 0 && (
        <button
          type="button"
          onClick={() => {
            terminalLogger.log(
              `[SEARCH-RESULTS] "${collapsed ? 'See more' : 'Load more'}" button clicked`
            );
            if (onExpand) onExpand();
          }}
          onMouseDown={(e) => e.preventDefault()}
          className="block w-full border-t border-neutral-600 bg-neutral-800/80 px-3 py-1 text-center text-xs uppercase tracking-wide text-neutral-300 hover:bg-neutral-700/60"
        >
          {collapsed ? 'See more…' : 'Load more…'}
        </button>
      )}
    </div>
  );
}

export const SearchResultsDropdown = memo(SearchResultsDropdownInner);
