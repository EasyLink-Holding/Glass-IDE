import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

// Possible views inside the MainPane (extend as needed)
export type MainView = 'welcome' | 'editor' | 'settings';

interface ViewCtx {
  view: MainView;
  setView: Dispatch<SetStateAction<MainView>>;
}

const Ctx = createContext<ViewCtx | null>(null);

// Externally accessible setter (used by shortcuts)
let externalSetView: Dispatch<SetStateAction<MainView>> | null = null;

export function toggleSettingsView() {
  externalSetView?.((prev) => (prev === 'settings' ? 'welcome' : 'settings'));
}

export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<MainView>('welcome');

  // expose setter for non-component contexts (e.g. shortcuts)
  useEffect(() => {
    externalSetView = setView;
    return () => {
      externalSetView = null;
    };
  }, []);

  return <Ctx.Provider value={{ view, setView }}>{children}</Ctx.Provider>;
}

export function useView() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useView must be inside <ViewProvider>');
  return ctx;
}
