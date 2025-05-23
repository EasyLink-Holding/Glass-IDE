import './index.css';
import './App.css';
import AppLayout from './AppLayout';
import { ViewProvider } from './contexts/ViewContext';

function App() {
  return (
    <ViewProvider>
      <AppLayout />
    </ViewProvider>
  );
}

export default App;
