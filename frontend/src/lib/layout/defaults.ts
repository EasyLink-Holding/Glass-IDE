import type { PaneId, SpaceId } from './types';

// Default template for the editor space
export const DEFAULT_EDITOR_TEMPLATE = 'two-sides';

// Default template for basic spaces with just one content pane
export const DEFAULT_BASIC_TEMPLATE = 'single';

// Default template mapping per space
export const DEFAULT_SPACE_TEMPLATE_MAP: Record<SpaceId, string> = {
  home: 'single',
  editor: 'two-sides',
  versionControl: 'single',
  database: 'single',
  docs: 'single',
  deployment: 'single',
  marketplace: 'single',
  teams: 'single',
  organization: 'single',
};

// Fallback constant (used when unknown) – keep same value as editor default
export const DEFAULT_TEMPLATE = DEFAULT_EDITOR_TEMPLATE;

// Default slot mapping for the editor space
export const DEFAULT_PANE_SLOT_MAP: Record<PaneId, string> = {
  explorer: 'left',
  editor: 'main',
  console: 'right',
};

// Default slot mapping for basic spaces
export const DEFAULT_BASIC_PANE_SLOT_MAP: Record<PaneId, string> = {
  explorer: 'none', // Not displayed in basic layout
  editor: 'main', // Main content area
  console: 'none', // Not displayed in basic layout
};
