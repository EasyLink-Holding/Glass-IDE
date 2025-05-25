import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PersistOptions } from 'zustand/middleware';
import { createDebouncedJSONStorage } from '../zustand/debouncedStorage';

// Define a union type of all known feature flag keys
export type FeatureKey = 'experimentalLayout' | 'betaChat' | 'performanceMode';

// Feature Store - manages feature flags for application capabilities
interface FeatureStore {
  features: Record<FeatureKey, boolean>;
  setFeature: (key: FeatureKey, enabled: boolean) => void;
  setFeatures: (features: Partial<Record<FeatureKey, boolean>>) => void;
  resetFeatures: () => void;
}

type PersistFeatureStore = PersistOptions<FeatureStore> & { version: number };

// Default feature flags
// Exported to allow reuse of keys elsewhere for type safety
export const DEFAULT_FEATURES: Record<FeatureKey, boolean> = {
  experimentalLayout: false,
  betaChat: false,
  performanceMode: false,
};

export const useFeatureStore = create<FeatureStore>()(
  persist(
    (set) => ({
      features: { ...DEFAULT_FEATURES },
      setFeature: (key, enabled) =>
        set((state) => ({
          features: { ...state.features, [key]: enabled },
        })),
      setFeatures: (features) =>
        set((state) => ({
          features: { ...state.features, ...features },
        })),
      resetFeatures: () => set({ features: { ...DEFAULT_FEATURES } }),
    }),
    {
      name: 'glass-ide-features',
      version: 1,
      storage: createDebouncedJSONStorage(),
    } as unknown as PersistFeatureStore
  )
);
