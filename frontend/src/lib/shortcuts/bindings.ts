import { MOD } from './utils';

/** Identifier type for each shortcut-able action */
export type ActionId = 'toggle.explorer' | 'toggle.editor' | 'toggle.console' | 'toggle.settings';

export interface ShortcutDef {
  id: ActionId;
  label: string;
  default: string;
}

export const SHORTCUT_DEFS: ShortcutDef[] = [
  { id: 'toggle.explorer', label: 'Toggle Explorer Pane', default: `${MOD}+e` },
  { id: 'toggle.editor', label: 'Toggle Editor Pane', default: `${MOD}+m` },
  { id: 'toggle.console', label: 'Toggle Chat Pane', default: `${MOD}+l` },
  { id: 'toggle.settings', label: 'Toggle Settings', default: `${MOD}+,` },
];
