import SearchBar from '../../features/search/ui/common/SearchBar';
import WindowControls from '../controls/WindowControls';
import SettingsButton from '../ui/buttons/SettingsButton';

/**
 * Top horizontal navigation bar above everything.
 */

export default function TopNavigationPane() {
  return (
    <header className="flex h-16 w-full items-center justify-between rounded-lg border border-neutral-700 bg-neutral-800/60 px-2 backdrop-blur z-20">
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
