/**
 * Settings API Layer
 *
 * This provides a clean, type-safe interface for accessing settings
 * organized by functional domain (UI, layout, shortcuts).
 *
 * Benefits:
 * - Better organization of settings by domain
 * - Type safety when accessing settings
 * - Easier refactoring if settings structure changes
 * - Simpler imports for components
 */
import { useCallback } from 'react';
import type { PaneId, SpaceId } from '../layout/types';
// Import types we need
import type { ActionId } from '../shortcuts/bindings';
import { useSettings } from './store';

// UI Settings
export function useUISettings() {
  const hideSystemControls = useSettings((s) => s.hideSystemControls);
  const setHideSystemControls = useCallback(
    (value: boolean) => useSettings.getState().set('hideSystemControls', value),
    []
  );

  return {
    // Properties
    hideSystemControls,

    // Setters
    setHideSystemControls,
  };
}

// Layout Settings
export function useLayoutSettings() {
  // Get settings from store
  const hiddenPanes = useSettings((s) => s.hiddenPanes);
  const spaceTemplateMap = useSettings((s) => s.spaceTemplateMap);
  const spacePaneSlotMaps = useSettings((s) => s.spacePaneSlotMaps);
  const set = useSettings((s) => s.set);

  // Create setter functions
  const togglePaneVisibility = useCallback(
    (paneId: PaneId) => {
      const currentHidden = useSettings.getState().hiddenPanes;
      set('hiddenPanes', {
        ...currentHidden,
        [paneId]: !currentHidden[paneId],
      });
    },
    [set]
  );

  const setSpaceTemplate = useCallback(
    (spaceId: SpaceId, templateId: string) => {
      const currentTemplates = { ...useSettings.getState().spaceTemplateMap };
      set('spaceTemplateMap', {
        ...currentTemplates,
        [spaceId]: templateId,
      });
    },
    [set]
  );

  const setPaneSlot = useCallback(
    (spaceId: SpaceId, paneId: PaneId, slotId: string) => {
      const currentMaps = useSettings.getState().spacePaneSlotMaps;
      const spaceMap = currentMaps[spaceId] || {};

      set('spacePaneSlotMaps', {
        ...currentMaps,
        [spaceId]: {
          ...spaceMap,
          [paneId]: slotId,
        },
      });
    },
    [set]
  );

  const resetLayout = useCallback(() => useSettings.getState().resetLayout(), []);

  return {
    // Properties
    hiddenPanes,
    spaceTemplateMap,
    spacePaneSlotMaps,

    // Actions
    togglePaneVisibility,
    setSpaceTemplate,
    setPaneSlot,
    resetLayout,
  };
}

// Shortcuts Settings
export function useShortcutSettings() {
  const shortcuts = useSettings((s) => s.shortcuts);
  const set = useSettings((s) => s.set);

  // Set a specific shortcut
  const setShortcut = useCallback(
    (actionId: ActionId, shortcutKeys: string) => {
      const currentShortcuts = { ...useSettings.getState().shortcuts };
      set('shortcuts', {
        ...currentShortcuts,
        [actionId]: shortcutKeys,
      });
    },
    [set]
  );

  // Reset all shortcuts to defaults
  const resetShortcuts = useCallback(() => {
    const { resetAllData } = useSettings.getState();
    resetAllData();
  }, []);

  return {
    // Properties
    shortcuts,

    // Actions
    setShortcut,
    resetShortcuts,
  };
}

// General settings operations
export function useGeneralSettings() {
  const resetAllData = useCallback(() => useSettings.getState().resetAllData(), []);

  return {
    resetAllData,
  };
}
