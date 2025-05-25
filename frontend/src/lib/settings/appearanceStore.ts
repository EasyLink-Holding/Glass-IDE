import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersistOptions } from 'zustand/middleware';
import { defaultSettings } from './schema';

// Appearance Store - manages UI appearance configuration
interface AppearanceStore {
  // Include existing settings from schema
  hideSystemControls: boolean;
  showNavBackground: boolean;

  // New appearance settings (can be added to schema later)
  theme: 'light' | 'dark' | 'system';
  fontSize: number;

  setHideSystemControls: (value: boolean) => void;
  setShowNavBackground: (value: boolean) => void;
  setTheme: (value: 'light' | 'dark' | 'system') => void;
  setFontSize: (value: number) => void;
  resetAppearance: () => void;
}

type PersistAppearanceStore = PersistOptions<AppearanceStore> & { version: number };

// Default values for new settings not yet in schema
const APPEARANCE_DEFAULTS = {
  theme: 'system' as const,
  fontSize: 14,
};

export const useAppearanceStore = create<AppearanceStore>()(
  persist(
    (set) => ({
      // Existing settings
      hideSystemControls: defaultSettings.hideSystemControls,
      showNavBackground: defaultSettings.showNavBackground,

      // New settings with defaults
      theme: APPEARANCE_DEFAULTS.theme,
      fontSize: APPEARANCE_DEFAULTS.fontSize,

      // Actions
      setHideSystemControls: (value) => set({ hideSystemControls: value }),
      setShowNavBackground: (value) => set({ showNavBackground: value }),
      setTheme: (value) => set({ theme: value }),
      setFontSize: (value) => {
        // Validate font size to ensure it's within a reasonable range
        // Minimum: 8px (very small but still readable)
        // Maximum: 32px (large but not excessive)
        const validatedSize = Math.max(8, Math.min(32, value));

        // Only update if the value is different after validation
        if (validatedSize !== value) {
          console.warn(
            `Font size ${value} was out of range and has been clamped to ${validatedSize}`
          );
        }

        set({ fontSize: validatedSize });
      },
      resetAppearance: () =>
        set({
          hideSystemControls: defaultSettings.hideSystemControls,
          showNavBackground: defaultSettings.showNavBackground,
          theme: APPEARANCE_DEFAULTS.theme,
          fontSize: APPEARANCE_DEFAULTS.fontSize,
        }),
    }),
    {
      name: 'glass-ide-appearance',
      version: 1,
    } as PersistAppearanceStore
  )
);
