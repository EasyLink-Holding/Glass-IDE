import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  children?: ReactNode;
}

/**
 * Detached rounded card that will contain search results.
 * Currently empty; appears below the search bar when `open` is true.
 */
export default function SearchDropdown({ open, children }: Props) {
  if (!open) return null;

  return (
    <div className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-neutral-600 bg-neutral-800/90 backdrop-blur-md shadow-lg">
      {children ?? <div className="p-4" />}
    </div>
  );
}
