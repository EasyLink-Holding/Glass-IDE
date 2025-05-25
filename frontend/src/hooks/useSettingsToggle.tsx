import { useCallback } from 'react';
import { toggleSettings as globalToggleSettings } from '../contexts/ViewContext';
import { useWorkspace } from '../contexts/ViewContext';

/**
 * Custom hook for toggling settings view
 * Uses the global toggle function for consistency
 * while providing React-friendly access
 */
export function useSettingsToggle() {
  const { view } = useWorkspace();

  // Create a memoized toggle function that uses the existing mechanism
  const toggleSettings = useCallback(() => {
    // Use the existing global toggle to maintain consistency
    globalToggleSettings();
  }, []);

  // Return both the toggle function and the current state
  return {
    toggleSettings,
    isSettingsOpen: view === 'settings',
  };
}
