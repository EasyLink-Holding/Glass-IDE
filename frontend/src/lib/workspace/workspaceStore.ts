// Use invoke for logging in Tauri v2
import { invoke } from '@tauri-apps/api/core';
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
 * Logs the action to the Rust console.
 */
export async function openWorkspace(): Promise<string | null> {
  // First check if we have a workspace already open
  const currentRoot = useWorkspaceStore.getState().rootPath;
  const isSwitch = currentRoot !== null;

  const selected = await open({ directory: true, multiple: false });
  if (typeof selected === 'string') {
    // Log the action to the Rust console
    try {
      await invoke('plugin:log|info', {
        message: isSwitch
          ? `Workspace switched from [${currentRoot}] to [${selected}]`
          : `Workspace opened: [${selected}]`,
      });
      console.log(
        isSwitch
          ? `Workspace switched from [${currentRoot}] to [${selected}]`
          : `Workspace opened: [${selected}]`
      );
    } catch (e) {
      // Fallback to console.log if plugin call fails
      console.log('Log error:', e);
    }

    useWorkspaceStore.getState().setRootPath(selected);
    return selected;
  }

  // Log if the user canceled
  try {
    await invoke('plugin:log|info', {
      message: isSwitch
        ? `Workspace switch cancelled, staying with [${currentRoot}]`
        : 'Workspace open cancelled by user',
    });
    console.log(
      isSwitch
        ? `Workspace switch cancelled, staying with [${currentRoot}]`
        : 'Workspace open cancelled by user'
    );
  } catch (e) {
    // Fallback to console.log if plugin call fails
    console.log('Log error:', e);
  }
  return null;
}

/**
 * Close the current workspace and log the action.
 */
export async function closeWorkspace() {
  const currentRoot = useWorkspaceStore.getState().rootPath;

  if (currentRoot) {
    // Log the action to the Rust console
    try {
      await invoke('plugin:log|info', {
        message: `Workspace closed: [${currentRoot}]`,
      });
      console.log(`Workspace closed: [${currentRoot}]`);
    } catch (e) {
      // Fallback to console.log if plugin call fails
      console.log('Log error:', e);
    }

    useWorkspaceStore.getState().clear();
  }
}
