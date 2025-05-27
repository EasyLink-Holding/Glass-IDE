import { create } from 'zustand';

// Data describing a single open editor tab
export interface EditorTabData {
  id: string;
  name: string;
  language: string;
  code: string;
}

interface TabStore {
  tabs: EditorTabData[];
  activeTabId: string | null;
  openTab: (tab: Partial<EditorTabData> & { name: string }) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabCode: (id: string, code: string) => void;
}

/**
 * Zustand store that manages open tabs in the editor.
 * For now all data is kept in-memory; file I/O will integrate later.
 */
export const useTabStore = create<TabStore>((set, get) => ({
  // Seed with one untitled tab so the editor always has content
  tabs: [
    {
      id: 'untitled-1',
      name: 'Untitled',
      language: 'typescript',
      code: '',
    },
  ],
  activeTabId: 'untitled-1',

  openTab: (tab) => {
    const { tabs } = get();

    // If a tab with the same name already exists, just activate it
    const existing = tabs.find((t) => t.name === tab.name);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }

    const id = tab.id ?? `tab-${Date.now()}`;
    const newTab: EditorTabData = {
      id,
      name: tab.name,
      language: tab.language ?? 'plaintext',
      code: tab.code ?? '',
    };

    set({ tabs: [...tabs, newTab], activeTabId: id });
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get();
    const remaining = tabs.filter((t) => t.id !== id);

    let newActive: string | null = activeTabId;
    if (activeTabId === id) {
      if (remaining.length) {
        // Prefer the tab to the left
        const closedIdx = tabs.findIndex((t) => t.id === id);
        newActive = remaining[Math.max(0, closedIdx - 1)].id;
      } else {
        newActive = null;
      }
    }

    set({ tabs: remaining, activeTabId: newActive });
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTabCode: (id, code) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, code } : t)),
    }));
  },
}));
