// Simple runtime check for Tauri.
// Extend Window with the optional `__TAURI__` object injected by Tauri.
interface TauriWindow extends Window {
  __TAURI__?: unknown;
}

// Use a function so the global can appear after initial module evaluation.
export const isTauri = (): boolean =>
  typeof window !== 'undefined' && Boolean((window as TauriWindow).__TAURI__);
