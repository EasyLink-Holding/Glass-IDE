// Centralised type-safe schema for user preferences.
// Extend this object for every new setting.

import { DEFAULT_PANE_SLOT_MAP, DEFAULT_TEMPLATE } from '../layout/defaults';
import type { PaneId } from '../layout/types';

export interface Settings {
  hideSystemControls: boolean;
  activeTemplateId: string;
  paneSlotMap: Record<PaneId, string>; // paneId -> slotId
  // add future settings here
}

export const defaultSettings: Settings = {
  hideSystemControls: false,
  activeTemplateId: DEFAULT_TEMPLATE,
  paneSlotMap: { ...DEFAULT_PANE_SLOT_MAP },
};

export type SettingKey = keyof Settings;
