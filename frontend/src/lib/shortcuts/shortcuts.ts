// Typed via custom declaration in src/types/hotkeys-js.d.ts
import hotkeys from 'hotkeys-js';
import { useEffect, useRef } from 'react';
import { switchSpace, toggleSettings } from '../../contexts/ViewContext';
import type { PaneId } from '../layout/types';
// Import shortcut settings from our new specialized store
import { useLayoutStore } from '../settings/layoutStore';
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
  // Use shortcuts from the layout store
  const shortcuts = useLayoutStore((state) => state.shortcuts);

  // Track key combinations bound by this hook instance so we can unbind them
  // precisely during re-binds and when the component unmounts.
  const boundKeysRef = useRef<string[]>([]);

  useEffect(() => {
    // Unbind previously-registered shortcuts for this component instance.
    for (const k of boundKeysRef.current) {
      hotkeys.unbind(k);
    }
    boundKeysRef.current = [];

    for (const [actionId, keyCombo] of Object.entries(shortcuts) as [ActionId, string][]) {
      if (!keyCombo) continue;

      hotkeys(keyCombo, (e: KeyboardEvent) => {
        e.preventDefault();
        const fn = actionHandlers[actionId];
        if (fn) {
          try {
            fn();
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error(`Error executing shortcut '${actionId}':`, err);
          }
        }
      });

      boundKeysRef.current.push(keyCombo);
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
  const store = useLayoutStore.getState();
  const hidden = store.hiddenPanes ?? ({} as Record<PaneId, boolean>);
  store.setHiddenPanes({ ...hidden, [paneId]: !hidden[paneId] });
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
