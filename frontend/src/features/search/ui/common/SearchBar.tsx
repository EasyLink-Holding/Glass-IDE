import { MagnifyingGlass as MagnifyingGlassIcon } from 'phosphor-react';
import { useRef, useState } from 'react';
import { memoIcon } from '../../../../lib/ui/memoIcon';
import SearchDropdown from './SearchBox';

const MagnifyingGlass = memoIcon(MagnifyingGlassIcon);

/**
 * Pure-UI pill-style search bar shown in the top navigation.
 * No functional logic yet – input is read-only.
 */
export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative w-full max-w-xs md:max-w-sm lg:max-w-md" data-no-drag>
      <label
        htmlFor="search-input"
        className="flex cursor-text items-center gap-2 rounded-full border border-neutral-600 bg-neutral-700/60 px-3 py-1 backdrop-blur focus-within:border-neutral-500"
      >
        <MagnifyingGlass size={16} weight="regular" className="text-neutral-400" />
        <input
          id="search-input"
          ref={inputRef}
          type="text"
          placeholder="Search your project"
          className="w-full bg-transparent text-sm text-neutral-200 placeholder-neutral-400 focus:outline-none"
          onFocus={() => setOpen(true)}
          onBlur={(e) => {
            // Close dropdown if focus leaves the container
            if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
              setOpen(false);
            }
          }}
        />
      </label>
      <SearchDropdown open={open} />
    </div>
  );
}
