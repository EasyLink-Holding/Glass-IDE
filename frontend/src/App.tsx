import './index.css';
import './App.css';
import { CircleNotch as CircleNotchIcon } from 'phosphor-react';
import { Suspense, lazy } from 'react';
import { ViewProvider } from './contexts/ViewContext';
import { useShortcutListener } from './lib/shortcuts/shortcuts';
import { memoIcon } from './lib/ui/memoIcon';

const CircleNotch = memoIcon(CircleNotchIcon);

// Lazy load the AppLayout component
// This ensures it's only loaded when needed, improving initial load time
const AppLayout = lazy(() => import('./AppLayout'));

function App() {
  // Install global keyboard shortcuts
  useShortcutListener();

  return (
    <ViewProvider>
      {/* Loading spinner while components are being fetched */}
      {/* Let Suspense handle the loading state - no artificial delay needed */}
      <Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center">
            <CircleNotch size={32} className="animate-spin text-blue-500" weight="bold" />
          </div>
        }
      >
        <AppLayout />
      </Suspense>
    </ViewProvider>
  );
}

export default App;
