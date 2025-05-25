import { listen } from '@tauri-apps/api/event';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useLayoutStore } from './lib/settings/layoutStore';
import './index.css';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error('Error rendering app:', error);
  }

  // Listen for reset-layout events from Tauri menu
  listen('reset-layout', () => {
    useLayoutStore.getState().resetLayout();
  }).catch((err) => {
    console.error('Failed to set up reset-layout listener:', err);
  });
} else {
  console.error('Root element not found, cannot render React app');
}
