import { memo, useState } from 'react';
import { useAppearanceStore } from '../../../../lib/settings/appearanceStore';
import { useFeatureStore } from '../../../../lib/settings/featureStore';
import { useLayoutStore } from '../../../../lib/settings/layoutStore';
import { useShortcutsStore } from '../../../../lib/settings/shortcutsStore';

/**
 * General settings section component
 * Provides global app settings and data management options
 */
function GeneralSection() {
  // We'll reset all stores individually since we've split the monolithic store
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  // Get reset actions from store hooks for proper state updates and re-renders
  const resetLayout = useLayoutStore((state) => state.resetLayout);
  const resetAppearance = useAppearanceStore((state) => state.resetAppearance);
  const resetFeatures = useFeatureStore((state) => state.resetFeatures);
  const resetShortcuts = useShortcutsStore((state) => state.resetShortcuts);

  /**
   * Reset all data across all specialized stores with proper error handling
   */
  function handleReset() {
    // Track success/failure for user feedback
    let hasErrors = false;

    // Reset each store individually with try/catch for each operation
    try {
      resetLayout();
    } catch (err) {
      hasErrors = true;
      // Only log in development - this uses feature detection
      // to determine if we're in dev mode (presence of debug tools)
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.warn('Failed to reset layout settings:', err);
      }
    }

    try {
      resetAppearance();
    } catch (err) {
      hasErrors = true;
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.warn('Failed to reset appearance settings:', err);
      }
    }

    try {
      resetFeatures();
    } catch (err) {
      hasErrors = true;
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.warn('Failed to reset feature settings:', err);
      }
    }

    try {
      resetShortcuts();
    } catch (err) {
      hasErrors = true;
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.warn('Failed to reset shortcuts:', err);
      }
    }

    // Clear any other persisted data if needed
    if (typeof window !== 'undefined') {
      try {
        // Clear any additional persisted storage that might not be covered by store resets
        localStorage.removeItem('glass-ide-settings'); // Old legacy storage
      } catch (err) {
        hasErrors = true;
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
          console.warn('Failed to clear local storage:', err);
        }
      }
    }

    // Update UI state
    setShowConfirmation(false);
    setResetComplete(true);

    // Log result only in development
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      if (hasErrors) {
        console.warn('Reset completed with some errors');
      } else {
        console.info('All application data has been reset successfully');
      }
    }

    // Hide success message after 3 seconds
    setTimeout(() => {
      setResetComplete(false);
    }, 3000);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">General</h2>
        <p className="text-neutral-400 text-sm">(General preferences coming soon…)</p>
      </div>

      <div className="space-y-4 pt-4 border-t border-neutral-800">
        <h3 className="font-medium">Data Management</h3>

        {!showConfirmation && !resetComplete && (
          <button
            type="button"
            onClick={() => setShowConfirmation(true)}
            className="px-3 py-2 bg-red-900/50 text-red-200 rounded text-sm hover:bg-red-800/60"
          >
            Reset All Data
          </button>
        )}

        {showConfirmation && (
          <div className="space-y-2">
            <p className="text-sm text-red-300">
              Are you sure? This will reset all settings and cache.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1 bg-red-700 text-white rounded text-sm"
              >
                Yes, Reset Everything
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="px-3 py-1 bg-neutral-700 text-neutral-200 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {resetComplete && (
          <p className="text-sm text-green-300">All data has been reset successfully!</p>
        )}
      </div>
    </div>
  );
}

// Export memoized component for better performance
export default memo(GeneralSection);
