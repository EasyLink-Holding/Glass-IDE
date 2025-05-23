import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

interface UISettingsCtx {
  showSystemControls: boolean;
  setShowSystemControls(val: boolean): void;
}

const Ctx = createContext<UISettingsCtx | null>(null);

export function UISettingsProvider({ children }: { children: ReactNode }) {
  const [showSystemControls, setShowSystemControls] = useState(true);

  return (
    <Ctx.Provider value={{ showSystemControls, setShowSystemControls }}>{children}</Ctx.Provider>
  );
}

export function useUISettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useUISettings must be inside <UISettingsProvider>');
  return ctx;
}
