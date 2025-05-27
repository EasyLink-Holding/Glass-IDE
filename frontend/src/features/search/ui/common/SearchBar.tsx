import { MagnifyingGlass as MagnifyingGlassIcon } from 'phosphor-react';
import { useEffect, useRef, useState } from 'react';
import { preloadSearch } from '../../../../lib/prefetch/searchPrefetch';
import { memoIcon } from '../../../../lib/ui/memoIcon';
import { useWorkspaceRoot } from '../../../../lib/workspace/workspaceStore';
import SearchDropdown from './SearchBox';

const MagnifyingGlass = memoIcon(MagnifyingGlassIcon);

/**
 * Pure-UI pill-style search bar shown in the top navigation.
 * No functional logic yet – input is read-only.
 */
export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const root = useWorkspaceRoot();

  // Debug: log when open/root/query changes
  useEffect(() => {
    console.log('[SB] open', open, 'query', query, 'root', root);
  }, [open, query, root]);

  return (
    <div
      className="relative w-full max-w-xs md:max-w-sm lg:max-w-md"
      data-no-drag
      onMouseEnter={() => root && preloadSearch(root)}
      ref={containerRef}
    >
      <label
        htmlFor="search-input"
        className="flex cursor-text items-center gap-2 rounded-full border border-neutral-600 bg-neutral-700/60 px-3 py-1 backdrop-blur focus-within:border-neutral-500"
      >
        <MagnifyingGlass size={16} weight="regular" className="text-neutral-400" />
        <input
          id="search-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          placeholder="Search your project"
          className="w-full bg-transparent text-sm text-neutral-200 placeholder-neutral-400 focus:outline-none"
          onFocus={() => {
            if (root) preloadSearch(root);
            setOpen(true);
          }}
          onBlur={(e) => {
            const next = e.relatedTarget as Node | null;
            if (!containerRef.current?.contains(next)) {
              setOpen(false);
            }
          }}
        />
      </label>
      <SearchDropdown key={`${open}-${query}`} open={open} query={query} />
    </div>
  );
}
