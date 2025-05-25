import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

import type { MainView, SpaceId } from '../lib/layout/types';
import { SPACES, VALID_VIEWS } from '../lib/layout/types';

interface WorkspaceCtx {
  space: SpaceId;
  view: MainView;
  setSpace: Dispatch<SetStateAction<SpaceId>>;
  setView: Dispatch<SetStateAction<MainView>>;
  toggleSettings: () => void;
}

const Ctx = createContext<WorkspaceCtx | null>(null);

// Externally accessible helper for toggling settings
let externalToggleSettings: (() => void) | null = null;

export function toggleSettings() {
  externalToggleSettings?.();
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [space, setSpace] = useState<SpaceId>('home');
  const [view, setView] = useState<MainView>('home');

  // Remember previous non-settings view for toggle
  const prevViewRef = useRef<MainView>('home');

  // Bind externals once
  useEffect(() => {
    externalToggleSettings = () => {
      setView((current) => {
        if (current === 'settings') {
          // Restore previous view
          return prevViewRef.current;
        }
        // Store current view before entering settings
        prevViewRef.current = current;
        return 'settings';
      });
    };
    return () => {
      externalToggleSettings = null;
    };
  }, []);

  // URL hash → #space=view  (simple impl, no parsing safety)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const [hashSpace, hashView] = hash.split('=');
    if (SPACES.includes(hashSpace as SpaceId)) {
      setSpace(hashSpace as SpaceId);
    }
    if (VALID_VIEWS.includes((hashView ?? hashSpace) as MainView)) {
      setView((hashView ?? hashSpace) as MainView);
    }
  }, []);

  // Keep hash updated
  useEffect(() => {
    window.history.replaceState(null, '', `#${space}=${view}`);
  }, [space, view]);

  const ctxValue: WorkspaceCtx = {
    space,
    view,
    setSpace,
    setView,
    toggleSettings: () => externalToggleSettings?.(),
  };

  return <Ctx.Provider value={ctxValue}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWorkspace must be inside <WorkspaceProvider>');
  return ctx;
}

export function useView() {
  return useWorkspace().view;
}

export const ViewProvider = WorkspaceProvider;
export const toggleSettingsView = toggleSettings;
