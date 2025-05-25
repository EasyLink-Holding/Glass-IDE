import './index.css';
import './App.css';
import { CircleNotch as CircleNotchIcon } from 'phosphor-react';
import { Suspense, lazy } from 'react';
import { ViewProvider } from './contexts/ViewContext';
import { useShortcutListener } from './lib/shortcuts/shortcuts';
import { memoIcon } from './lib/ui/memoIcon';

const CircleNotch = memoIcon(CircleNotchIcon);

// Lazy load the AppLayout component
const AppLayout = lazy(() => {
  return import('./AppLayout').catch((error) => {
    console.error('Failed to load AppLayout:', error);
    throw error; // Re-throw to let suspense handle it
  });
});

function App() {
  // Install global keyboard shortcuts
  try {
    useShortcutListener();
  } catch (error) {
    console.error('Failed to initialize shortcuts:', error);
  }

  return (
    <ViewProvider>
      {/* Loading spinner while components are being fetched */}
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
