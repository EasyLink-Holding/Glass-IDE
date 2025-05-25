import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { create } from 'zustand';
import { batchedInvoke } from '../lib/tauri/batchedCommunication';

export interface FsNode {
  id: string;
  name: string;
  depth: number;
  kind: 'file' | 'dir';
}

interface FsChange {
  paths: string[];
  kind: string;
}

interface FileTreeState {
  nodes: FsNode[];
  root: string;
  depth: number;
  loading: boolean;
  load: (root: string, depth: number) => void;
  refresh: () => void;
}

export const useFileTreeStore = create<FileTreeState>((set, get) => ({
  nodes: [],
  root: '',
  depth: 2,
  loading: false,

  load: async (root: string, depth: number) => {
    // Start snapshot fetch
    set({ loading: true, root, depth });
    const nodes = await batchedInvoke<FsNode[]>('read_dir_snapshot', { path: root, depth });
    set({ nodes, loading: false });

    // Start backend watcher (fire-and-forget)
    void batchedInvoke('start_fs_watch', { path: root });
  },

  refresh: async () => {
    const { root, depth } = get();
    if (!root) return;
    set({ loading: true });
    const nodes = await batchedInvoke<FsNode[]>('read_dir_snapshot', { path: root, depth });
    set({ nodes, loading: false });
  },
}));

// Ensure we attach listener exactly once across all components
let listenerAttached = false;

function attachFsListener() {
  if (listenerAttached) return;
  listenerAttached = true;
  listen<FsChange>('fs:change', () => {
    // debounce multiple rapid events into single refresh
    const REFRESH_DELAY = 200;
    const store = useFileTreeStore;
    const timer: NodeJS.Timeout | undefined = (
      attachFsListener as unknown as { timer?: NodeJS.Timeout }
    ).timer;
    if (timer) clearTimeout(timer);
    (attachFsListener as unknown as { timer?: NodeJS.Timeout }).timer = setTimeout(() => {
      store.getState().refresh();
    }, REFRESH_DELAY);
  }).catch((err) => {
    console.error('Failed to listen for fs:change', err);
  });
}

export function useFileTree(root: string, depth = 2): FsNode[] {
  const { nodes, load } = useFileTreeStore();
  useEffect(() => {
    load(root, depth);
    attachFsListener();
  }, [root, depth, load]);
  return nodes;
}

// Selector hooks -------------------------------------------------------------
export function useFileTreeDepthSlice(maxDepth: number): FsNode[] {
  return useFileTreeStore((state) => state.nodes.filter((n) => n.depth <= maxDepth));
}

export function useFileTreeSlice(prefixPath: string): FsNode[] {
  return useFileTreeStore((state) => state.nodes.filter((n) => n.id.startsWith(prefixPath)));
}
