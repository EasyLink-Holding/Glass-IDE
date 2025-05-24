import { type SetState, type StateCreator, create } from 'zustand';
import { persist } from 'zustand/middleware';
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
      paneSlotMap: { ...DEFAULT_PANE_SLOT_MAP },
    }),
});

export const useSettings = create<Store>()(persist(creator, { name: 'glass-ide-settings' }));
