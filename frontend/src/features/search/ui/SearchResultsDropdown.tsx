import { memo } from 'react';
import { VirtualList } from '../../../components/ui/virtual/VirtualList';

interface Props {
  results: string[];
  onSelect: (path: string) => void;
  loading?: boolean;
}

function SearchResultsDropdownInner({ results, onSelect, loading }: Props) {
  if (!results.length && !loading) return null;
  const items = loading ? Array.from({ length: 8 }, (_, i) => `loading-${i}`) : results;

  return (
    <div className="absolute left-0 right-0 top-full mt-2 max-h-96 rounded-lg border border-neutral-600 bg-neutral-800/90 shadow-lg backdrop-blur">
      <VirtualList
        items={items}
        itemSize={28}
        height={300}
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
    </div>
  );
}

export const SearchResultsDropdown = memo(SearchResultsDropdownInner);
