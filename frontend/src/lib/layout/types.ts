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
