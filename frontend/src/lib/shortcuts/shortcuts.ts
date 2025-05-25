// Typed via custom declaration in src/types/hotkeys-js.d.ts
import hotkeys from 'hotkeys-js';
import { useEffect, useRef } from 'react';
import { switchSpace, toggleSettings } from '../../contexts/ViewContext';
import type { PaneId } from '../layout/types';
// Import layout store for pane functions
import { useLayoutStore } from '../settings/layoutStore';
// Import shortcut settings from the specialized shortcut store
import { useShortcutsStore } from '../settings/shortcutsStore';
import { ACTION_LABELS, type ActionId, DEFAULT_SHORTCUTS, type ShortcutMap } from './bindings';
// We need to type check the action IDs but the IDE can handle it now
import { MOD, formatShortcut, isMac } from './utils';

// -----------------------------------------------------------------------------
// Runtime registry -------------------------------------------------------------------
// -----------------------------------------------------------------------------

const actionHandlers: Partial<Record<ActionId, () => void>> = {};

/**
 * Register a handler for an action. Call at module scope of each feature.
 */
export function registerShortcut(actionId: ActionId, handler: () => void) {
  actionHandlers[actionId] = handler;
}

/**
 * React hook – installs/uninstalls hotkeys based on current Settings.
 * Place once near the root (e.g. in App component).
 */
export function useShortcutListener() {
  // Use shortcuts from the dedicated shortcuts store
  // Safely access shortcuts with fallback to DEFAULT_SHORTCUTS if not available
  const shortcuts = useShortcutsStore((state) => state.shortcuts) || DEFAULT_SHORTCUTS;

  // Configure hotkeys to work everywhere, including in input fields and content editable elements
  // This is crucial for shortcuts to work in the editor space
  hotkeys.filter = () => true;

  // Track key combinations bound by this hook instance so we can unbind them
  // precisely during re-binds and when the component unmounts.
  const boundKeysRef = useRef<string[]>([]);

  useEffect(() => {
    // Unbind previously-registered shortcuts for this component instance.
    for (const k of boundKeysRef.current) {
      hotkeys.unbind(k);
    }
    boundKeysRef.current = [];

    // Safety check - ensure shortcuts object exists before trying to iterate
    if (!shortcuts) {
      console.warn('[GLASS-IDE] Shortcuts object is undefined or null, using defaults');
      return;
    }

    try {
      // Use safe version of Object.entries with type checking
      for (const entry of Object.entries(shortcuts)) {
        if (!entry || entry.length !== 2) continue;

        const [actionId, keyCombo] = entry as [ActionId, string];
        if (!keyCombo) continue;

        hotkeys(keyCombo, (e: KeyboardEvent) => {
          e.preventDefault();
          const fn = actionHandlers[actionId];
          if (fn) {
            try {
              fn();
            } catch (err) {
              console.error(`[GLASS-IDE] Error executing shortcut '${actionId}':`, err);
            }
          }
        });

        boundKeysRef.current.push(keyCombo);
      }
    } catch (error) {
      console.error('[GLASS-IDE] Error setting up shortcuts:', error);
    }

    // Clean-up when the component unmounts.
    return () => {
      for (const k of boundKeysRef.current) {
        hotkeys.unbind(k);
      }
      boundKeysRef.current = [];
    };
  }, [shortcuts]);
}

// -----------------------------------------------------------------------------
// Built-in pane toggle shortcuts ------------------------------------------------
// -----------------------------------------------------------------------------

function togglePane(paneId: PaneId) {
  // Get current state from layout store
  const layoutStore = useLayoutStore.getState();
  const currentHiddenState = layoutStore.hiddenPanes;

  // Toggle the visibility of the specified pane
  layoutStore.setHiddenPanes({
    ...currentHiddenState,
    [paneId]: !currentHiddenState[paneId],
  });
}

export function setupPaneShortcuts() {
  registerShortcut('toggle.explorer', () => togglePane('explorer'));
  registerShortcut('toggle.main', () => togglePane('main'));
  registerShortcut('toggle.chat', () => togglePane('chat'));
  registerShortcut('toggle.settings', toggleSettings);
}

export function setupSpaceShortcuts() {
  registerShortcut('go.home', () => switchSpace('home'));
  registerShortcut('go.editor', () => switchSpace('editor'));
  registerShortcut('go.versionControl', () => switchSpace('versionControl'));
  registerShortcut('go.database', () => switchSpace('database'));
  registerShortcut('go.docs', () => switchSpace('docs'));
  registerShortcut('go.deployment', () => switchSpace('deployment'));
  registerShortcut('go.marketplace', () => switchSpace('marketplace'));
  registerShortcut('go.teams', () => switchSpace('teams'));
  registerShortcut('go.organization', () => switchSpace('organization'));
}

// Ensure built-ins are registered when this module is imported.
setupPaneShortcuts();
setupSpaceShortcuts();

export { DEFAULT_SHORTCUTS, ACTION_LABELS };
export { isMac, MOD, formatShortcut };
export type { ShortcutMap, ActionId };
