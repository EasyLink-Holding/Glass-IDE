import { type SetState, type StateCreator, create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersistOptions } from 'zustand/middleware';
// Import settings defaults
import { DEFAULT_SPACE_TEMPLATE_MAP } from '../layout/defaults';
import { type SettingKey, type Settings, defaultSettings } from './schema';

interface Store extends Settings {
  set<K extends SettingKey>(key: K, value: Settings[K]): void;
  resetLayout: () => void;
  resetAllData: () => void;
}

const creator: StateCreator<Store> = (set: SetState<Store>) => ({
  ...defaultSettings,
  set: <K extends SettingKey>(key: K, value: Settings[K]) =>
    set({ [key]: value } as Partial<Settings>),
  // Reset only the layout-related settings
  resetLayout: () =>
    set({
      spaceTemplateMap: { ...DEFAULT_SPACE_TEMPLATE_MAP },
      spacePaneSlotMaps: {
        home: { explorer: 'none', editor: 'main', console: 'none' },
        editor: { explorer: 'left', editor: 'main', console: 'right' },
        versionControl: { explorer: 'none', editor: 'main', console: 'none' },
        database: { explorer: 'none', editor: 'main', console: 'none' },
        docs: { explorer: 'none', editor: 'main', console: 'none' },
        deployment: { explorer: 'none', editor: 'main', console: 'none' },
        marketplace: { explorer: 'none', editor: 'main', console: 'none' },
        teams: { explorer: 'none', editor: 'main', console: 'none' },
        organization: { explorer: 'none', editor: 'main', console: 'none' },
      },
      hiddenPanes: { explorer: false, editor: false, console: false },
    }),

  // Reset all settings to default values
  resetAllData: () => {
    // Clear all state and replace with defaults
    set(defaultSettings);

    // Clear any persisted data if needed
    if (typeof window !== 'undefined') {
      try {
        // Clear any persisted Zustand state
        localStorage.removeItem('glass-settings');
        console.log('All application data has been reset');
      } catch (err) {
        console.error('Failed to clear local storage:', err);
      }
    }
  },
});

type PersistStore = PersistOptions<Store> & { version: number };

export const useSettings = create<Store>()(
  persist(creator, {
    name: 'glass-ide-settings',
    version: 1,
    migrate: (state: unknown, version: number): Store => {
      // Simple forward-compatible migration; adjust when schema evolves
      const prev = (state ?? {}) as Partial<Settings>;
      if (version === 0) {
        return { ...defaultSettings, ...prev } as Store;
      }
      return { ...defaultSettings, ...prev } as Store;
    },
  } as PersistStore)
);
