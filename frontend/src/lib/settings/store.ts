import { type SetState, type StateCreator, create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersistOptions } from 'zustand/middleware';
import { DEFAULT_PANE_SLOT_MAP, DEFAULT_TEMPLATE } from '../layout/defaults';
import { type SettingKey, type Settings, defaultSettings } from './schema';

interface Store extends Settings {
  set<K extends SettingKey>(key: K, value: Settings[K]): void;
  resetLayout: () => void;
}

const creator: StateCreator<Store> = (set: SetState<Store>) => ({
  ...defaultSettings,
  set: <K extends SettingKey>(key: K, value: Settings[K]) =>
    set({ [key]: value } as Partial<Settings>),
  resetLayout: () =>
    set({
      activeTemplateId: DEFAULT_TEMPLATE,
      paneSlotMap: DEFAULT_PANE_SLOT_MAP,
    }),
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
