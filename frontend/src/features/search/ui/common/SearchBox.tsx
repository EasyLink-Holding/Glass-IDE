import { useState } from 'react';
import { useWorkspaceRoot } from '../../../../lib/workspace/workspaceStore';
import { useWorkspaceSearch } from '../../lib/useWorkspaceSearch';
import { SearchResultsDropdown } from '../SearchResultsDropdown';

interface Props {
  open: boolean;
  // children removed – unused
}

/**
 * Detached rounded card that will contain search results.
 * Currently empty; appears below the search bar when `open` is true.
 */
export default function SearchDropdown({ open }: Props) {
  const [query, setQuery] = useState('');
  const root = useWorkspaceRoot();
  const { results, loading } = useWorkspaceSearch(root ?? '', query);

  if (!open) return null;

  if (!root) {
    return (
      <div className="rounded border border-neutral-700 bg-neutral-800/60 p-4 text-sm text-neutral-400">
        Open a workspace to enable search.
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        /* eslint-disable-next-line jsx-a11y/no-autofocus */
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search files…"
        className="w-full rounded border border-neutral-600 bg-neutral-800/50 px-3 py-1 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none"
      />
      <SearchResultsDropdown
        results={results}
        loading={loading}
        onSelect={(path) => {
          console.log('selected path', path);
          // TODO: open file in editor pane
        }}
      />
    </div>
  );
}
