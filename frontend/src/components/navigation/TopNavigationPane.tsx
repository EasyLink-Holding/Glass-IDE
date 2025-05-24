import { GearSix } from 'phosphor-react';
import { useView } from '../../contexts/ViewContext';
import SearchBar from '../../features/search/SearchBar';
/**
 * Top horizontal navigation bar above everything.
 */
import WindowControls from '../controls/WindowControls';

export default function TopNavigationPane() {
  const { view, setView } = useView();
  return (
    <header className="flex h-16 w-full items-center justify-between rounded-lg border border-neutral-700 bg-neutral-800/60 px-2 backdrop-blur z-20">
      <WindowControls />
      <div className="mx-auto flex flex-1 justify-center">
        <SearchBar />
      </div>
      <div className="ml-auto flex items-center">
        <button
          type="button"
          onClick={() => setView(view === 'settings' ? 'welcome' : 'settings')}
          aria-label="Settings"
          className="p-1 text-neutral-200 hover:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-500"
          data-no-drag
        >
          <GearSix size={20} weight="regular" />
        </button>
      </div>
      {/* place for title or menu */}
    </header>
  );
}
