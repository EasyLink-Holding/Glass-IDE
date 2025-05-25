import { listen } from '@tauri-apps/api/event';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useLayoutStore } from './lib/settings/layoutStore';
import './index.css';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  // Listen for reset-layout events from Tauri menu
  listen('reset-layout', () => {
    useLayoutStore.getState().resetLayout();
  });
}
