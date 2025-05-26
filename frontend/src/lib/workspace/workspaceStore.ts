import { open } from '@tauri-apps/plugin-dialog';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkspaceStore {
  rootPath: string | null;
  setRootPath: (path: string) => void;
  clear: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      rootPath: null,
      setRootPath: (path) => set({ rootPath: path }),
      clear: () => set({ rootPath: null }),
    }),
    {
      name: 'glass-ide-workspace',
    }
  )
);

/** Hook shortcut */
export const useWorkspaceRoot = () => useWorkspaceStore((s) => s.rootPath);

/**
 * Show native folder picker and persist the selection.
 * Returns the chosen path or null if cancelled.
 */
export async function openWorkspace(): Promise<string | null> {
  const selected = await open({ directory: true, multiple: false });
  if (typeof selected === 'string') {
    useWorkspaceStore.getState().setRootPath(selected);
    return selected;
  }
  return null;
}

export function closeWorkspace() {
  useWorkspaceStore.getState().clear();
}
