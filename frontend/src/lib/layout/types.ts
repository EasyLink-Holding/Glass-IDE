export type SplitDir = 'row' | 'col';

export interface SplitNode {
  type: 'split';
  dir: SplitDir;
  ratio?: number[]; // flex-grow ratios per child
  children: LayoutNode[];
}

export interface SlotNode {
  type: 'slot';
  id: string; // unique within template
}

export type LayoutNode = SplitNode | SlotNode;

export interface LayoutTemplate {
  id: string;
  name: string;
  root: LayoutNode;
}

export type PaneId = 'explorer' | 'editor' | 'console'; // extend later

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
  editor: 'main',
  console: 'right',
};

export const DEFAULT_BASIC_PANE_SLOT_MAP: PaneSlotMap = {
  explorer: 'none',
  editor: 'main',
  console: 'none',
};
