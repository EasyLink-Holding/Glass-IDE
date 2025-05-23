// Centralised type-safe schema for user preferences.
// Extend this object for every new setting.

export interface Settings {
  hideSystemControls: boolean;
  // add future settings here
}

export const defaultSettings: Settings = {
  hideSystemControls: false,
};

export type SettingKey = keyof Settings;
