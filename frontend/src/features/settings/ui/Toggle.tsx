import { memo, useCallback } from 'react';
import { useAppearanceStore } from '../../../lib/settings/appearanceStore';
import { useFeatureStore } from '../../../lib/settings/featureStore';
// Import FeatureKey type directly from featureStore instead of redefining it
import type { FeatureKey } from '../../../lib/settings/featureStore';
import { useLayoutStore } from '../../../lib/settings/layoutStore';
import type { SettingKey } from '../../../lib/settings/schema';

// Import the constants to ensure keys are in sync
import { DEFAULT_FEATURES } from '../../../lib/settings/featureStore';

/**
 * Type guard to check if a string is a valid feature key
 * Uses the keys from DEFAULT_FEATURES to ensure we're always in sync with the source of truth
 *
 * @param key The key to check
 * @returns True if the key is a valid FeatureKey
 */
function isValidFeatureKey(key: string): key is FeatureKey {
  // Get keys directly from the DEFAULT_FEATURES object to maintain a single source of truth
  const validKeys = Object.keys(DEFAULT_FEATURES) as FeatureKey[];
  return validKeys.includes(key as FeatureKey);
}

// Settings configuration map to improve maintainability
// Makes it easier to add new settings without modifying multiple places
const SETTINGS_CONFIG = {
  appearance: ['hideSystemControls', 'showNavBackground'],
  layout: ['hiddenPanes'], // Only include boolean layout settings
  // Any setting not in the above categories is assumed to be a feature flag
} as const;

// Map settings to their setter methods for appearance store
const APPEARANCE_SETTERS = {
  hideSystemControls: 'setHideSystemControls',
  showNavBackground: 'setShowNavBackground',
} as const;

/**
 * A reusable toggle component for boolean settings
 */
interface Props {
  /**
   * The setting key to toggle. Must be a boolean setting.
   */
  settingKey: SettingKey;

  /**
   * The label to display next to the toggle
   */
  label: string;

  /**
   * Optional description to display below the toggle
   */
  description?: string;
}

/**
 * Toggle component with store-specific logic for different setting types
 */
function Toggle({ settingKey, label, description }: Props) {
  // Determine which store to use based on the setting key using our configuration map
  const isAppearanceSetting = SETTINGS_CONFIG.appearance.includes(
    settingKey as (typeof SETTINGS_CONFIG.appearance)[number]
  );
  const isLayoutSetting = SETTINGS_CONFIG.layout.includes(
    settingKey as (typeof SETTINGS_CONFIG.layout)[number]
  );

  // Get value based on store type
  let value = false;

  // Appearance settings (simple booleans)
  if (isAppearanceSetting) {
    value = useAppearanceStore((state) => {
      return typeof state[settingKey as keyof typeof state] === 'boolean'
        ? (state[settingKey as keyof typeof state] as boolean)
        : false;
    });
  }
  // Layout settings (only some are booleans)
  else if (isLayoutSetting) {
    value = useLayoutStore((state) => {
      // For hiddenPanes, we check if ANY pane is hidden
      // This toggle controls the visibility of ALL panes together
      if (settingKey === 'hiddenPanes') {
        // Return true if any pane is hidden, false if all are visible
        // This means the toggle will be checked when panes are hidden
        return Object.values(state.hiddenPanes).some((value) => value) || false;
      }

      // For other properties, check if they're boolean
      const stateValue = state[settingKey as keyof typeof state];
      return typeof stateValue === 'boolean' ? stateValue : false;
    });
  }
  // Feature flags
  else {
    // Extract feature name from the key if it has 'features.' prefix
    const rawFeatureKey = settingKey.startsWith('features.')
      ? settingKey.replace('features.', '')
      : settingKey;

    // Only use known feature keys (type-safe approach)
    // Use the isValidFeatureKey function defined at the top of the file

    // Use the feature value if it's a valid key, otherwise default to false
    value = useFeatureStore((state) => {
      return isValidFeatureKey(rawFeatureKey) ? state.features[rawFeatureKey] : false;
    });
  }

  // Create a stable change handler
  const handleChange = useCallback(
    (checked: boolean) => {
      if (isAppearanceSetting) {
        // Use the settings map to get the appropriate setter method name
        const setterName = APPEARANCE_SETTERS[settingKey as keyof typeof APPEARANCE_SETTERS];

        // Only proceed if we have a valid setter method
        if (setterName) {
          // Get the setter from the store
          const appearanceStore = useAppearanceStore.getState();
          const setter = appearanceStore[setterName];

          // Runtime check to verify the setter exists and is a function
          if (setter && typeof setter === 'function') {
            // Now we can safely call it
            setter(checked);
          } else {
            // Log warning in development only
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
              console.warn(`Setter method ${setterName} not found or not a function`);
            }
          }
        }
      } else if (isLayoutSetting) {
        // For hiddenPanes specifically - this controls ALL panes together
        if (settingKey === 'hiddenPanes') {
          // Get current hiddenPanes
          const hiddenPanes = useLayoutStore.getState().hiddenPanes;

          // This toggle controls the global visibility state for all panes
          // When checked=true, all panes will be set to hidden
          // When checked=false, all panes will be set to visible
          const updatedHiddenPanes = Object.keys(hiddenPanes).reduce(
            (acc, paneId) => {
              // Set all panes to the same visibility state
              acc[paneId] = checked;
              return acc;
            },
            {} as Record<string, boolean>
          );

          // Update the store with the new pane visibility settings
          useLayoutStore.getState().setHiddenPanes(updatedHiddenPanes);
        }
      } else {
        // Feature flags - extract and validate the feature key
        const rawFeatureKey = settingKey.startsWith('features.')
          ? settingKey.replace('features.', '')
          : settingKey;

        // Use the isValidFeatureKey function defined at the top of the file

        // Only update if it's a valid feature key
        if (isValidFeatureKey(rawFeatureKey)) {
          useFeatureStore.getState().setFeature(rawFeatureKey, checked);
        } else {
          console.warn(`Attempted to set unknown feature flag: ${rawFeatureKey}`);
        }
      }
    },
    [settingKey, isAppearanceSetting, isLayoutSetting]
  );

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => handleChange(e.target.checked)}
          className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-blue-500 focus:ring-blue-500"
        />
        <span className="select-none text-sm">{label}</span>
      </label>
      {description && <p className="ml-6 text-xs text-neutral-400">{description}</p>}
    </div>
  );
}

// Export a memoized version for better performance
export default memo(Toggle);
