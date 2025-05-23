/**
 * Top horizontal navigation bar above everything.
 */
import WindowControls from '../controls/WindowControls';

export default function TopNavigationPane() {
  return (
    <header className="flex h-16 w-full items-center justify-between rounded-lg border border-neutral-700 bg-neutral-800/60 px-2 backdrop-blur">
      <WindowControls />
      {/* place for title or menu */}
    </header>
  );
}
