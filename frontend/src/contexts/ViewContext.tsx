import type { Dispatch, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

// Possible views inside the MainPane (extend as needed)
export type MainView = 'welcome' | 'editor' | 'settings';

interface ViewCtx {
  view: MainView;
  setView: Dispatch<MainView>;
}

const Ctx = createContext<ViewCtx | null>(null);

export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<MainView>('welcome');

  return <Ctx.Provider value={{ view, setView }}>{children}</Ctx.Provider>;
}

export function useView() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useView must be inside <ViewProvider>');
  return ctx;
}
