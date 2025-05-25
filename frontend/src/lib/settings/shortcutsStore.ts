import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersistOptions } from 'zustand/middleware';
import { type ActionId, DEFAULT_SHORTCUTS, type ShortcutMap } from '../shortcuts/shortcuts';

// Shortcuts Store - manages keyboard shortcuts
interface ShortcutsStore {
  // Keyboard shortcuts mapping
  shortcuts: ShortcutMap;

  // Update a single shortcut
  setShortcut: (actionId: ActionId, shortcut: string) => void;

  // Update multiple shortcuts at once
  setShortcuts: (shortcuts: ShortcutMap) => void;

  // Reset all shortcuts to defaults
  resetShortcuts: () => void;
}

type PersistShortcutsStore = PersistOptions<ShortcutsStore> & { version: number };

export const useShortcutsStore = create<ShortcutsStore>()(
  persist(
    (set) => ({
      shortcuts: { ...DEFAULT_SHORTCUTS },

      setShortcut: (actionId, shortcut) =>
        set((state) => ({
          shortcuts: { ...state.shortcuts, [actionId]: shortcut },
        })),

      setShortcuts: (shortcuts) => set({ shortcuts }),

      resetShortcuts: () => set({ shortcuts: { ...DEFAULT_SHORTCUTS } }),
    }),
    {
      name: 'glass-ide-shortcuts',
      version: 1,
      migrate: (state: unknown, _version: number) => {
        // Simple migration from old format if needed
        const prev = (state ?? {}) as Partial<ShortcutsStore>;

        // Return only the state data without method placeholders
        // Zustand will automatically add the store methods after migration
        return {
          shortcuts: { ...DEFAULT_SHORTCUTS, ...(prev.shortcuts || {}) },
        };
      },
    } as PersistShortcutsStore
  )
);
