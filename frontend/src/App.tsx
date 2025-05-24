import './index.css';
import './App.css';
import AppLayout from './AppLayout';
import { ViewProvider } from './contexts/ViewContext';
import { useShortcutListener } from './lib/shortcuts/shortcuts';

function App() {
  // Install global keyboard shortcuts
  useShortcutListener();

  return (
    <ViewProvider>
      <AppLayout />
    </ViewProvider>
  );
}

export default App;
