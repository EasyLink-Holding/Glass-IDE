// Centralised type-safe schema for user preferences.
// Extend this object for every new setting.

import { DEFAULT_SPACE_TEMPLATE_MAP } from '../layout/defaults';
import type { PaneId, SpaceId } from '../layout/types';
import type { ShortcutMap } from '../shortcuts/shortcuts';
import { DEFAULT_SHORTCUTS } from '../shortcuts/shortcuts';

export interface Settings {
  hideSystemControls: boolean;
  spaceTemplateMap: Record<SpaceId, string>; // Per-space template mapping
  spacePaneSlotMaps: Record<SpaceId, Record<PaneId, string>>; // Per-space pane slot mappings
  shortcuts: ShortcutMap;
  hiddenPanes: Record<PaneId, boolean>;
}

export const defaultSettings: Settings = {
  hideSystemControls: false,
  spaceTemplateMap: { ...DEFAULT_SPACE_TEMPLATE_MAP },
  spacePaneSlotMaps: {
    home: { explorer: 'none', editor: 'main', console: 'none' },
    editor: { explorer: 'left', editor: 'main', console: 'right' },
    versionControl: { explorer: 'none', editor: 'main', console: 'none' },
    database: { explorer: 'none', editor: 'main', console: 'none' },
    docs: { explorer: 'none', editor: 'main', console: 'none' },
    deployment: { explorer: 'none', editor: 'main', console: 'none' },
    marketplace: { explorer: 'none', editor: 'main', console: 'none' },
    teams: { explorer: 'none', editor: 'main', console: 'none' },
    organization: { explorer: 'none', editor: 'main', console: 'none' },
  },
  shortcuts: { ...DEFAULT_SHORTCUTS },
  hiddenPanes: { explorer: false, editor: false, console: false },
  // add future settings here after this line
} as Settings;

export type SettingKey = keyof Settings;
