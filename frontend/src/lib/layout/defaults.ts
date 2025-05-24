import type { PaneId } from './types';

export const DEFAULT_TEMPLATE = 'two-sides';

export const DEFAULT_PANE_SLOT_MAP: Record<PaneId, string> = {
  explorer: 'left',
  editor: 'main',
  console: 'right',
};
