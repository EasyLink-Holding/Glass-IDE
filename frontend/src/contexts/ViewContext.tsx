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
  switchSpace: (space: SpaceId) => void;
}

const Ctx = createContext<WorkspaceCtx | null>(null);

// Externally accessible helper for toggling settings
let externalToggleSettings: (() => void) | null = null;

// Externally accessible helper for switching space
let externalSwitchSpace: ((space: SpaceId) => void) | null = null;

export function toggleSettings() {
  externalToggleSettings?.();
}

export function switchSpace(space: SpaceId) {
  externalSwitchSpace?.(space);
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

    externalSwitchSpace = (s: SpaceId) => {
      setSpace(s);
      setView(s);
    };

    return () => {
      externalToggleSettings = null;
      externalSwitchSpace = null;
    };
  }, []);

  // URL hash management → #space=view
  useEffect(() => {
    try {
      // Extract hash without the '#' symbol
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) return;

      // Handle different hash formats
      let spaceId: string | null = null;
      let viewId: string | null = null;

      if (hash.includes('=')) {
        // Format: #space=view
        const parts = hash.split('=');
        spaceId = parts[0] || null;
        viewId = parts[1] || null;
      } else {
        // Format: #space (view defaults to space)
        spaceId = hash;
        viewId = hash;
      }

      // Validate and set space if valid
      if (spaceId && SPACES.includes(spaceId as SpaceId)) {
        setSpace(spaceId as SpaceId);
      }

      // Validate and set view if valid
      if (viewId && VALID_VIEWS.includes(viewId as MainView)) {
        setView(viewId as MainView);
      }
    } catch (error) {
      console.warn('Error parsing URL hash:', error);
      // Fallback to defaults on error
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
    switchSpace: (space: SpaceId) => externalSwitchSpace?.(space),
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
