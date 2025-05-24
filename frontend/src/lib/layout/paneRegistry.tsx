import type { ReactElement } from 'react';
import type { PaneId } from './types';

// Individual pane implementations
import ChatPane from '../../components/layout/chat/ChatPane';
import ExplorerPane from '../../components/layout/explorer/ExplorerPane';
import MainPane from '../../components/layout/main/MainPane';

/**
 * Central pane registry – single source of truth.
 *
 * Add new panes here and they will automatically appear everywhere
 * (DynamicLayout, Template visualisers, etc.).
 */
export const paneRegistry: Record<PaneId, ReactElement> = {
  explorer: <ExplorerPane />,
  editor: <MainPane />,
  console: <ChatPane />,
};

/**
 * Optional helper for dynamic registration (e.g. plug-ins).
 * Note: Registration occurs at runtime, therefore should be called
 * before first render.
 */
export function registerPane(id: PaneId, element: ReactElement) {
  // eslint-disable-next-line no-param-reassign
  (paneRegistry as Record<string, ReactElement>)[id] = element;
}
