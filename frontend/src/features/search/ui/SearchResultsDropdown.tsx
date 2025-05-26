import { memo, useCallback } from 'react';
import { VirtualList } from '../../../components/ui/virtual/VirtualList';

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
  if (!results.length && !loading) return null;
  // Memo to avoid recomputing slices on each render if inputs unchanged
  const displayResults = useCallback(
    () => (collapsed ? results.slice(0, showCount) : results),
    [results, collapsed, showCount]
  );
  const items = loading ? Array.from({ length: 8 }, (_, i) => `loading-${i}`) : displayResults();
  const height = collapsed ? items.length * 28 : 300;

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
      {(collapsed || hasMore) && !loading && (
        <button
          type="button"
          onClick={onExpand}
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
