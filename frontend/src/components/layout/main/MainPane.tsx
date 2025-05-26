/** Center main pane */
import { type ReactNode, Suspense, lazy, useMemo } from 'react';
import { useView } from '../../../contexts/ViewContext';
import ErrorBoundary from '../../common/ErrorBoundary';

// Lazy-loaded heavy panes.
const SettingsPane = lazy(
  () => import(/* webpackChunkName: "pane-settings" */ '../../../app/settings/SettingsPane')
);
const VersionControlPane = lazy(
  () =>
    import(
      /* webpackChunkName: "pane-version-control" */ '../../../app/versionControl/VersionControlPane'
    )
);
const DatabasePane = lazy(
  () => import(/* webpackChunkName: "pane-database" */ '../../../app/database/DatabasePane')
);
const DocsPane = lazy(
  () => import(/* webpackChunkName: "pane-docs" */ '../../../app/docs/DocsPane')
);
const DeploymentPane = lazy(
  () => import(/* webpackChunkName: "pane-deployment" */ '../../../app/deployment/DeploymentPane')
);
const MarketplacePane = lazy(
  () =>
    import(/* webpackChunkName: "pane-marketplace" */ '../../../app/marketplace/MarketplacePane')
);
const TeamsPane = lazy(
  () => import(/* webpackChunkName: "pane-teams" */ '../../../app/teams/TeamsPane')
);
const OrganizationPane = lazy(
  () =>
    import(/* webpackChunkName: "pane-organization" */ '../../../app/organization/OrganizationPane')
);
const EditorPane = lazy(
  () => import(/* webpackChunkName: "pane-editor" */ '../../../app/editor/EditorPane')
);
const HomePane = lazy(
  () => import(/* webpackChunkName: "pane-home" */ '../../../app/home/HomePane')
);

// Memoize pane switching to prevent unnecessary re-renders of the switch body
export default function MainPane() {
  const view = useView();

  const content = useMemo<ReactNode>(() => {
    switch (view) {
      case 'settings':
        return <SettingsPane />;
      case 'editor':
        return <EditorPane />; // retro-compat: main editor view
      case 'versionControl':
        return <VersionControlPane />;
      case 'database':
        return <DatabasePane />;
      case 'docs':
        return <DocsPane />;
      case 'deployment':
        return <DeploymentPane />;
      case 'marketplace':
        return <MarketplacePane />;
      case 'teams':
        return <TeamsPane />;
      case 'organization':
        return <OrganizationPane />;
      case 'home':
        return <HomePane />;
      default:
        return <HomePane />;
    }
  }, [view]);

  return (
    <main className="flex-1 min-w-0 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900/60 p-2 text-neutral-100">
      <ErrorBoundary>
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-neutral-800/40" />}>
          {content}
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
