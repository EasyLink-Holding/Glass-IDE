import { getCurrentWindow } from '@tauri-apps/api/window';

const win = getCurrentWindow();

/*
 * macOS traffic-light spec (NSWindow):
 * diameter ≈ 12 px with 6 px horizontal gap.
 * No default button padding/appearance.
 */
const btnBase = [
  'h-[12px] w-[12px] rounded-full', // circle size
  'inline-block mr-[6px] first:ml-0', // spacing
  'hover:opacity-80 active:scale-95',
  'appearance-none p-0 border-0', // remove UA padding that caused pill shape
].join(' ');

export default function WindowControls() {
  return (
    <div className="flex items-center" data-no-drag>
      <button
        type="button"
        className={`${btnBase} bg-red-500`}
        onClick={() => win.close()}
        aria-label="Close window"
      />
      <button
        type="button"
        className={`${btnBase} bg-yellow-400`}
        onClick={() => win.minimize()}
        aria-label="Minimize window"
      />
      <button
        type="button"
        className={`${btnBase} bg-green-500`}
        onClick={() =>
          win.isMaximized().then((m: boolean) => (m ? win.unmaximize() : win.maximize()))
        }
        aria-label="Maximize window"
      />
    </div>
  );
}
