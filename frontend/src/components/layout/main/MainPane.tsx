/** Center main pane */
import { type ReactNode, Suspense, lazy } from 'react';
import { useView } from '../../../contexts/ViewContext';

// Lazy-loaded heavy panes.
const SettingsPane = lazy(() => import('../../../features/settings/SettingsPane'));
// TODO: lazy-load editor once implemented

function WelcomePane() {
  return <div className="p-4 text-neutral-200">Welcome to Glass-IDE!</div>;
}

export default function MainPane() {
  const { view } = useView();

  let content: ReactNode;
  switch (view) {
    case 'settings':
      content = <SettingsPane />;
      break;
    case 'editor':
      content = <div className="p-4 text-neutral-200">Editor coming soon…</div>;
      break;
    default:
      content = <WelcomePane />;
      break;
  }

  return (
    <main className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900/60 p-2 text-neutral-100">
      <Suspense fallback={<div className="p-4 text-neutral-400">Loading…</div>}>{content}</Suspense>
    </main>
  );
}
