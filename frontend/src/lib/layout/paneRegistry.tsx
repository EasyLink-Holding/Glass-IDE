import type { ComponentType } from 'react';
import type { PaneId } from './types';

// Individual pane implementations
import ChatPane from '../../app/editor/ChatPane';
import ExplorerPane from '../../app/editor/ExplorerPane';
import MainPane from '../../components/layout/main/MainPane';

/**
 * Central pane registry – maps pane IDs to component types.
 * Each DynamicLayout render will instantiate fresh elements, ensuring
 * context/state updates propagate correctly.
 */
export const paneRegistry: Record<PaneId, ComponentType> = {
  explorer: ExplorerPane,
  editor: MainPane,
  console: ChatPane,
};

/**
 * Optional helper for dynamic registration (e.g. plug-ins).
 * Note: Registration occurs at runtime, therefore should be called
 * before first render.
 */
export function registerPane(id: PaneId, element: ComponentType) {
  // eslint-disable-next-line no-param-reassign
  (paneRegistry as Record<string, ComponentType>)[id] = element;
}
