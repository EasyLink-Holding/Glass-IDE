// Centralised type-safe schema for user preferences.
// Extend this object for every new setting.

import { DEFAULT_SPACE_TEMPLATE_MAP } from '../layout/defaults';
import type { PaneId, SpaceId } from '../layout/types';
import type { ShortcutMap } from '../shortcuts/shortcuts';
import { DEFAULT_SHORTCUTS } from '../shortcuts/shortcuts';

export interface Settings {
  // UI Settings
  hideSystemControls: boolean;
  showNavBackground: boolean;

  // Layout Settings
  spaceTemplateMap: Record<SpaceId, string>; // Per-space template mapping
  spacePaneSlotMaps: Record<SpaceId, Record<PaneId, string>>; // Per-space pane slot mappings
  hiddenPanes: Record<PaneId, boolean>;

  // Shortcut Settings
  shortcuts: ShortcutMap;
}

export const defaultSettings: Settings = {
  hideSystemControls: false,
  showNavBackground: false, // Default to no background for navigation panes
  spaceTemplateMap: { ...DEFAULT_SPACE_TEMPLATE_MAP },
  spacePaneSlotMaps: {
    home: { explorer: 'none', main: 'main', chat: 'none' },
    editor: { explorer: 'left', main: 'main', chat: 'right' },
    versionControl: { explorer: 'none', main: 'main', chat: 'none' },
    database: { explorer: 'none', main: 'main', chat: 'none' },
    docs: { explorer: 'none', main: 'main', chat: 'none' },
    deployment: { explorer: 'none', main: 'main', chat: 'none' },
    marketplace: { explorer: 'none', main: 'main', chat: 'none' },
    teams: { explorer: 'none', main: 'main', chat: 'none' },
    organization: { explorer: 'none', main: 'main', chat: 'none' },
  },
  shortcuts: { ...DEFAULT_SHORTCUTS },
  hiddenPanes: { explorer: false, main: false, chat: false },
  // add future settings here after this line
} as Settings;

export type SettingKey = keyof Settings;
