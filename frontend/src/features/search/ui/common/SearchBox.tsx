import { useMemo, useState } from 'react';
import { useWorkspaceRoot } from '../../../../lib/workspace/workspaceStore';
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
  const trimmed = useMemo(() => query.trim(), [query]);
  const { results, loading, loadMore, hasMore } = useWorkspaceSearch(root ?? '', trimmed);
  const [collapsed, setCollapsed] = useState(true);

  if (!query && !collapsed) setCollapsed(true);

  if (!open) return null;

  if (!root) {
    return (
      <div className="rounded border border-neutral-700 bg-neutral-800/60 p-4 text-sm text-neutral-400">
        Open a workspace to enable search.
      </div>
    );
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
