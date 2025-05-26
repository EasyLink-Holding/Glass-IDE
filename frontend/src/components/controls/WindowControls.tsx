import { memo, useEffect, useState } from 'react';
import { useAppearanceStore } from '../../lib/settings/appearanceStore';

// Defer tauri window API until runtime to avoid inlining heavy helpers.
import type { Window as TauriWindow } from '@tauri-apps/api/window';

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

/**
 * Window control buttons (macOS style)
 *
 * Important: Tauri window API is initialized inside useEffect to ensure
 * the IPC bridge is ready before making any calls.
 */
function WindowControls() {
  const hide = useAppearanceStore((state) => state.hideSystemControls);
  // Track window API state
  const [windowInstance, setWindowInstance] = useState<TauriWindow | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);

  // Initialize window API after component mounts
  useEffect(() => {
    // Safely initialize window API
    (async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        setWindowInstance(win as TauriWindow);
        setIsApiReady(true);
      } catch (error) {
        console.error('[WindowControls] Failed to initialize window API:', error);
        setIsApiReady(false);
      }
    })();
    // Cleanup function not needed as this is initialization only
  }, []);

  // Don't render controls if hidden or API not ready
  if (hide || !isApiReady || !windowInstance) return null;

  // Safe window operations with error handling
  const safeClose = () => {
    try {
      windowInstance.close();
    } catch (error) {
      console.error('[WindowControls] Failed to close window:', error);
    }
  };

  const safeMinimize = () => {
    try {
      windowInstance.minimize();
    } catch (error) {
      console.error('[WindowControls] Failed to minimize window:', error);
    }
  };

  const safeToggleMaximize = async () => {
    try {
      const isMaximized = await windowInstance.isMaximized();
      if (isMaximized) {
        await windowInstance.unmaximize();
      } else {
        await windowInstance.maximize();
      }
    } catch (error) {
      console.error('[WindowControls] Failed to toggle maximize:', error);
    }
  };

  return (
    <div className="flex items-center" data-no-drag>
      <button
        type="button"
        className={`${btnBase} bg-red-500`}
        onClick={safeClose}
        aria-label="Close window"
      />
      <button
        type="button"
        className={`${btnBase} bg-yellow-400`}
        onClick={safeMinimize}
        aria-label="Minimize window"
      />
      <button
        type="button"
        className={`${btnBase} bg-green-500`}
        onClick={safeToggleMaximize}
        aria-label="Maximize window"
      />
    </div>
  );
}

// Export a memoized version to prevent unnecessary re-renders
export default memo(WindowControls);
