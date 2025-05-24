// Centralised type-safe schema for user preferences.
// Extend this object for every new setting.

import { DEFAULT_PANE_SLOT_MAP, DEFAULT_TEMPLATE } from '../layout/defaults';
import type { PaneId } from '../layout/types';
import type { ShortcutMap } from '../shortcuts/shortcuts';
import { DEFAULT_SHORTCUTS } from '../shortcuts/shortcuts';

export interface Settings {
  hideSystemControls: boolean;
  activeTemplateId: string;
  paneSlotMap: Record<PaneId, string>; // paneId -> slotId
  shortcuts: ShortcutMap;
  hiddenPanes: Record<PaneId, boolean>;
}

export const defaultSettings: Settings = {
  hideSystemControls: false,
  activeTemplateId: DEFAULT_TEMPLATE,
  paneSlotMap: { ...DEFAULT_PANE_SLOT_MAP },
  shortcuts: { ...DEFAULT_SHORTCUTS },
  hiddenPanes: { explorer: false, editor: false, console: false },
  // add future settings here after this line
};

export type SettingKey = keyof Settings;
