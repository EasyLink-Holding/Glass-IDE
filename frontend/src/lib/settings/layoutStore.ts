import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersistOptions } from 'zustand/middleware';
import { DEFAULT_SPACE_TEMPLATE_MAP } from '../layout/defaults';
import { createDebouncedJSONStorage } from '../zustand/debouncedStorage';
import type { Settings } from './schema';
import { defaultSettings } from './schema';

// Layout Store - manages UI layout configuration
interface LayoutStore {
  // Removed shortcuts to prevent duplication with shortcutsStore
  spaceTemplateMap: Settings['spaceTemplateMap'];
  spacePaneSlotMaps: Settings['spacePaneSlotMaps'];
  hiddenPanes: Settings['hiddenPanes'];
  setSpaceTemplateMap: (value: Settings['spaceTemplateMap']) => void;
  setSpacePaneSlotMaps: (value: Settings['spacePaneSlotMaps']) => void;
  setHiddenPanes: (value: Settings['hiddenPanes']) => void;
  // Removed setShortcuts to prevent duplication
  resetLayout: () => void;
}

type PersistLayoutStore = PersistOptions<LayoutStore> & { version: number };

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      spaceTemplateMap: defaultSettings.spaceTemplateMap,
      spacePaneSlotMaps: defaultSettings.spacePaneSlotMaps,
      hiddenPanes: defaultSettings.hiddenPanes,
      // Removed shortcuts state to prevent duplication with shortcutsStore
      setSpaceTemplateMap: (value) => set({ spaceTemplateMap: value }),
      setSpacePaneSlotMaps: (value) => set({ spacePaneSlotMaps: value }),
      setHiddenPanes: (value) => set({ hiddenPanes: value }),
      // Removed setShortcuts method to prevent duplication
      resetLayout: () =>
        set({
          spaceTemplateMap: { ...DEFAULT_SPACE_TEMPLATE_MAP },
          spacePaneSlotMaps: {
            home: { explorer: 'none', main: 'main', chat: 'none' },
            editor: { explorer: 'left', main: 'main', chat: 'right' },
            versionControl: { explorer: 'none', main: 'main', chat: 'none' },
            database: { explorer: 'none', main: 'main', chat: 'none' },
            docs: { explorer: 'none', main: 'main', chat: 'none' },
            deployment: { explorer: 'none', main: 'main', chat: 'none' },
            marketplace: { explorer: 'none', main: 'main', chat: 'none' },
            teams: { explorer: 'none', main: 'main', chat: 'none' },
            organization: { explorer: 'none', main: 'main', chat: 'none' },
          },
          hiddenPanes: { explorer: false, main: false, chat: false },
          // Removed shortcuts reset to prevent duplication with shortcutsStore
        }),
    }),
    {
      name: 'glass-ide-layout',
      version: 1,
      storage: createDebouncedJSONStorage(),
    } as unknown as PersistLayoutStore
  )
);
