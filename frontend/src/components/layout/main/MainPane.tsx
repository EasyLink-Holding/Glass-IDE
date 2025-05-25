/** Center main pane */
import { type ReactNode, Suspense, lazy } from 'react';
import { useView } from '../../../contexts/ViewContext';
import ErrorBoundary from '../../common/ErrorBoundary';

// Lazy-loaded heavy panes.
const SettingsPane = lazy(() => import('../../../app/settings/SettingsPane'));
const VersionControlPane = lazy(() => import('../../../app/versionControl/VersionControlPane'));
const DatabasePane = lazy(() => import('../../../app/database/DatabasePane'));
const DocsPane = lazy(() => import('../../../app/docs/DocsPane'));
const DeploymentPane = lazy(() => import('../../../app/deployment/DeploymentPane'));
const MarketplacePane = lazy(() => import('../../../app/marketplace/MarketplacePane'));
const TeamsPane = lazy(() => import('../../../app/teams/TeamsPane'));
const OrganizationPane = lazy(() => import('../../../app/organization/OrganizationPane'));
const EditorPane = lazy(() => import('../../../app/editor/EditorPane'));
const HomePane = lazy(() => import('../../../app/home/HomePane'));

export default function MainPane() {
  const view = useView();

  let content: ReactNode;
  switch (view) {
    case 'settings':
      content = <SettingsPane />;
      break;
    case 'editor':
      content = <EditorPane />;
      break;
    case 'versionControl':
      content = <VersionControlPane />;
      break;
    case 'database':
      content = <DatabasePane />;
      break;
    case 'docs':
      content = <DocsPane />;
      break;
    case 'deployment':
      content = <DeploymentPane />;
      break;
    case 'marketplace':
      content = <MarketplacePane />;
      break;
    case 'teams':
      content = <TeamsPane />;
      break;
    case 'organization':
      content = <OrganizationPane />;
      break;
    case 'home':
      content = <HomePane />;
      break;
    default:
      content = <HomePane />;
      break;
  }

  return (
    <main className="flex-1 min-w-0 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900/60 p-2 text-neutral-100">
      <ErrorBoundary>
        <Suspense fallback={<div className="p-4 text-neutral-400">Loading…</div>}>
          {content}
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
