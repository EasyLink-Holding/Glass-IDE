import { MOD } from './utils';

export const SHORTCUT_DEFS = [
  { id: 'toggle.explorer', label: 'Toggle Explorer Pane', default: `${MOD}+e` },
  { id: 'toggle.main', label: 'Toggle Main Pane', default: `${MOD}+m` },
  { id: 'toggle.chat', label: 'Toggle Chat Pane', default: `${MOD}+l` },
  { id: 'toggle.settings', label: 'Toggle Settings', default: `${MOD}+,` },
  { id: 'go.home', label: 'Go to Home', default: `${MOD}+1` },
  { id: 'go.editor', label: 'Go to Editor', default: `${MOD}+2` },
  { id: 'go.versionControl', label: 'Go to Version Control', default: `${MOD}+3` },
  { id: 'go.database', label: 'Go to Database', default: `${MOD}+4` },
  { id: 'go.docs', label: 'Go to Docs', default: `${MOD}+5` },
  { id: 'go.deployment', label: 'Go to Deployment', default: `${MOD}+6` },
  { id: 'go.marketplace', label: 'Go to Marketplace', default: `${MOD}+7` },
  { id: 'go.teams', label: 'Go to Teams', default: `${MOD}+8` },
  { id: 'go.organization', label: 'Go to Organization', default: `${MOD}+9` },
] as const;

export type ShortcutDef = (typeof SHORTCUT_DEFS)[number];
export type ActionId = ShortcutDef['id'];

export const DEFAULT_SHORTCUTS: Record<ActionId, string> = Object.fromEntries(
  SHORTCUT_DEFS.map((d) => [d.id, d.default])
) as Record<ActionId, string>;

export const ACTION_LABELS: Record<ActionId, string> = Object.fromEntries(
  SHORTCUT_DEFS.map((d) => [d.id, d.label])
) as Record<ActionId, string>;

export type ShortcutMap = Record<ActionId, string>;
