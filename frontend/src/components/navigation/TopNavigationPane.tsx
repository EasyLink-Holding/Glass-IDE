import { memo } from 'react';
import SearchBar from '../../features/search/ui/common/SearchBar';
import { useAppearanceStore } from '../../lib/settings/appearanceStore';
import WindowControls from '../controls/WindowControls';
import SettingsButton from '../ui/buttons/SettingsButton';

/**
 * Top horizontal navigation bar above everything.
 */

function TopNavigationPane() {
  const showNavBackground = useAppearanceStore((state) => state.showNavBackground);
  return (
    <header
      className={`flex h-16 w-full items-center justify-between rounded-lg ${showNavBackground ? 'border border-neutral-700 bg-neutral-800/60 backdrop-blur' : ''} px-2 z-20`}
    >
      <WindowControls />
      <div className="mx-auto flex flex-1 justify-center">
        <SearchBar />
      </div>
      <div className="ml-auto flex items-center">
        <SettingsButton />
      </div>
      {/* place for title or menu */}
    </header>
  );
}

// Export a memoized version to prevent unnecessary re-renders
export default memo(TopNavigationPane);
