export type SplitDir = 'row' | 'col';

export interface SplitNode {
  type: 'split';
  dir: SplitDir;
  ratio?: number[];
  children: LayoutNode[];
}

export interface SlotNode {
  type: 'slot';
  id: string;
}

export type LayoutNode = SplitNode | SlotNode;

export interface LayoutTemplate {
  id: string;
  name: string;
  root: LayoutNode;
}

// Central list of all built-in panes for compile-time safety.
export type PaneId =
  | 'explorer'
  | 'main'
  | 'chat'
  | 'database'
  | 'docs'
  | 'deployment'
  | 'marketplace'
  | 'teams'
  | 'organization'
  | 'versionControl'
  | 'settings';

export type SpaceId =
  | 'home'
  | 'editor'
  | 'versionControl'
  | 'database'
  | 'docs'
  | 'deployment'
  | 'marketplace'
  | 'teams'
  | 'organization';

export type MainView = SpaceId | 'settings';

export const SPACES: SpaceId[] = [
  'home',
  'editor',
  'versionControl',
  'database',
  'docs',
  'deployment',
  'marketplace',
  'teams',
  'organization',
];

/**
 * Runtime check to ensure a given string is a valid `SpaceId`.
 * Useful when receiving arbitrary input (e.g. from DOM events).
 */
export function isSpaceId(value: string): value is SpaceId {
  return (SPACES as readonly string[]).includes(value);
}

export const VALID_VIEWS: MainView[] = [...SPACES, 'settings'];

export type TemplateId = string;

export type ViewTemplateMap = { [space in SpaceId]: TemplateId };

export type PaneSlotMap = { [pane: string]: string };

export const DEFAULT_EDITOR_TEMPLATE = 'two-sides';
export const DEFAULT_BASIC_TEMPLATE = 'single';

export const DEFAULT_SPACE_TEMPLATE_MAP: ViewTemplateMap = {
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

export const DEFAULT_EDITOR_PANE_SLOT_MAP: PaneSlotMap = {
  explorer: 'left',
  main: 'main',
  chat: 'right',
};

export const DEFAULT_BASIC_PANE_SLOT_MAP: PaneSlotMap = {
  explorer: 'none',
  main: 'main',
  chat: 'none',
};
