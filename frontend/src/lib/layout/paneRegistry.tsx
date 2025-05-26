import type { ComponentType, LazyExoticComponent } from 'react';
import { Suspense, lazy } from 'react';
import SkeletonPane from '../../components/common/SkeletonPane';
import type { PaneId } from './types';

// Lazy load all panes to improve initial load time and chunk size
// Each pane will only be fetched when it's actually needed in the UI
// Vite magic comments to enforce separate chunks for heavy panes.
// @vite-ignore ensures proper chunk naming
const ChatPane = lazy(
  () => import(/* webpackChunkName: "pane-chat" */ '../../app/editor/ChatPane')
);
const ExplorerPane = lazy(
  () => import(/* webpackChunkName: "pane-explorer" */ '../../app/editor/ExplorerPane')
);
const MainPane = lazy(
  () => import(/* webpackChunkName: "pane-main" */ '../../components/layout/main/MainPane')
);

// Other panes loaded on-demand
const DatabasePane = lazy(
  () => import(/* webpackChunkName: "pane-database" */ '../../app/database/DatabasePane')
);
const DocsPane = lazy(() => import(/* webpackChunkName: "pane-docs" */ '../../app/docs/DocsPane'));
const DeploymentPane = lazy(
  () => import(/* webpackChunkName: "pane-deployment" */ '../../app/deployment/DeploymentPane')
);
const MarketplacePane = lazy(
  () => import(/* webpackChunkName: "pane-marketplace" */ '../../app/marketplace/MarketplacePane')
);
const TeamsPane = lazy(
  () => import(/* webpackChunkName: "pane-teams" */ '../../app/teams/TeamsPane')
);
const OrganizationPane = lazy(
  () =>
    import(/* webpackChunkName: "pane-organization" */ '../../app/organization/OrganizationPane')
);
const VersionControlPane = lazy(
  () =>
    import(
      /* webpackChunkName: "pane-version-control" */ '../../app/versionControl/VersionControlPane'
    )
);
const SettingsPane = lazy(
  () => import(/* webpackChunkName: "pane-settings" */ '../../app/settings/SettingsPane')
);

// Create a wrapper that adds Suspense fallback for all lazy-loaded panes
const createPaneWithSuspense = (
  LazyComponent: LazyExoticComponent<ComponentType<Record<string, unknown>>>
) => {
  // Return a component that wraps the lazy-loaded component with Suspense
  return () => (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <SkeletonPane />
        </div>
      }
    >
      <LazyComponent />
    </Suspense>
  );
};

/**
 * Central pane registry – maps pane IDs to component types.
 * Each DynamicLayout render will instantiate fresh elements, ensuring
 * context/state updates propagate correctly.
 *
 * Wraps all lazy-loaded components with Suspense to handle loading states gracefully
 */
export const paneRegistry: Record<PaneId, ComponentType> = {
  explorer: createPaneWithSuspense(ExplorerPane),
  main: createPaneWithSuspense(MainPane),
  chat: createPaneWithSuspense(ChatPane),
  database: createPaneWithSuspense(DatabasePane),
  docs: createPaneWithSuspense(DocsPane),
  deployment: createPaneWithSuspense(DeploymentPane),
  marketplace: createPaneWithSuspense(MarketplacePane),
  teams: createPaneWithSuspense(TeamsPane),
  organization: createPaneWithSuspense(OrganizationPane),
  versionControl: createPaneWithSuspense(VersionControlPane),
  settings: createPaneWithSuspense(SettingsPane),
};

/**
 * A safer approach to identify React lazy components.
 * Since React internals can change and accessing them is brittle,
 * we'll use a more pragmatic approach based on common patterns.
 */
function isLazyComponent(
  component: ComponentType | LazyExoticComponent<ComponentType>
): component is LazyExoticComponent<ComponentType> {
  // Convert to a string representation for inspection
  // This avoids accessing internal properties directly
  const componentString = String(component);

  // Lazy components typically have distinctive string representations
  return (
    // Check for common patterns in the string representation
    componentString.includes('lazy') ||
    // Additional checks for future React versions
    componentString.includes('Lazy')
  );
}

/**
 * Optional helper for dynamic registration (e.g. plug-ins).
 * Note: Registration occurs at runtime, therefore should be called
 * before first render.
 */
export function registerPane(
  id: PaneId,
  element: ComponentType | LazyExoticComponent<ComponentType>
) {
  // If it's a lazy component, wrap it with Suspense
  // Use the reliable type guard function instead of displayName check
  const wrappedElement = isLazyComponent(element) ? createPaneWithSuspense(element) : element;

  // eslint-disable-next-line no-param-reassign
  (paneRegistry as Record<string, ComponentType>)[id] = wrappedElement;
}
