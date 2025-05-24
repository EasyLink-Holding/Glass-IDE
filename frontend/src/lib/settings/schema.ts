// Centralised type-safe schema for user preferences.
// Extend this object for every new setting.

export interface Settings {
  hideSystemControls: boolean;
  activeTemplateId: string;
  paneSlotMap: Record<string, string>; // paneId -> slotId
  // add future settings here
}

export const defaultSettings: Settings = {
  hideSystemControls: false,
  activeTemplateId: 'two-sides',
  paneSlotMap: {},
};

export type SettingKey = keyof Settings;
