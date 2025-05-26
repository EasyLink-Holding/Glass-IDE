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
  /** Flattened list of all nodes fetched so far */
  nodes: FsNode[];
  root: string;
  /** Map of expanded directory id -> true */
  expanded: Record<string, boolean>;
  /** Map of directories which already have their children loaded */
  loaded: Record<string, boolean>;
  /** Map of directories currently loading */
  loadingDirs: Record<string, boolean>;
  /** Load initial shallow snapshot */
  loadRoot: (root: string, depth: number) => void;
  /** Toggle expand / collapse */
  toggleDir: (id: string) => void;
  /** Refresh entire tree (e.g. on fs watcher) */
  refresh: () => void;
  /** Incremental apply based on fs watcher event */
  applyFsChange: (change: FsChange) => void;
}

const INITIAL_DEPTH = 2; // depth for first snapshot – keeps first paint snappy

export const useIncFileTreeStore = create<FileTreeState>((set, get) => ({
  nodes: [],
  root: '',
  expanded: {},
  loaded: {},
  loadingDirs: {},

  async loadRoot(root: string, depth: number = INITIAL_DEPTH) {
    try {
      set({ root });
      // Load initial shallow snapshot
      const nodes = await batchedInvoke<FsNode[]>('read_dir_snapshot', { path: root, depth });
      set({ nodes });
      // Start watcher fire-and-forget
      void batchedInvoke('start_fs_watch', { path: root });
    } catch (err) {
      console.error('[IncFileTree] loadRoot failed', err);
    }
  },

  async toggleDir(id: string) {
    const state = get();
    const isExpanded = !!state.expanded[id];
    // Collapse path ⇒ simply un-mark expanded (children stay cached)
    if (isExpanded) {
      set({ expanded: { ...state.expanded, [id]: false } });
      return;
    }

    // Expand path
    set({ expanded: { ...state.expanded, [id]: true } });

    // If already loaded we are done
    if (state.loaded[id]) return;

    // Mark loading
    set({ loadingDirs: { ...state.loadingDirs, [id]: true } });

    let children: FsNode[] = [];
    try {
      // Fetch immediate children
      children = await batchedInvoke<FsNode[]>('read_dir_children', { path: id });
    } catch (err) {
      console.error('[IncFileTree] read_dir_children failed', err);
      set({ loadingDirs: { ...state.loadingDirs, [id]: false } });
      return;
    }

    // Re-read current state inside async closure
    const current = get();
    const parentIndex = current.nodes.findIndex((n) => n.id === id);
    if (parentIndex === -1) return;
    const parentDepth = current.nodes[parentIndex].depth;

    // Adjust child depths relative to parent
    const adjusted = children.map((c) => ({ ...c, depth: parentDepth + 1 + c.depth }));

    const newNodes = [
      ...current.nodes.slice(0, parentIndex + 1),
      ...adjusted,
      ...current.nodes.slice(parentIndex + 1),
    ];

    set({
      nodes: newNodes,
      loaded: { ...current.loaded, [id]: true },
      loadingDirs: { ...current.loadingDirs, [id]: false },
    });
  },

  async refresh() {
    const { root } = get();
    if (!root) return;
    const nodes = await batchedInvoke<FsNode[]>('read_dir_snapshot', {
      path: root,
      depth: INITIAL_DEPTH,
    });
    set({ nodes });
  },

  /** Apply incremental fs change */
  async applyFsChange(change: FsChange) {
    const state = get();

    // Helper to get parent dir path quickly
    const parentDir = (p: string) => {
      const pos = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\'));
      return pos === -1 ? state.root : p.slice(0, pos);
    };

    // Handle removals synchronously – cheap array filter
    if (change.kind.includes('Remove')) {
      const toRemove = new Set(change.paths);
      // Remove both the node and any nested children
      const newNodes = state.nodes.filter(
        (n) => !Array.from(toRemove).some((r) => n.id === r || n.id.startsWith(`${r}/`))
      );
      if (newNodes.length !== state.nodes.length) {
        set({ nodes: newNodes });
      }
    }

    // Handle additions / modifications – refresh parent dir listing if it’s already loaded
    if (change.kind.includes('Create') || change.kind.includes('Modify')) {
      // Unique parent directories
      const parents = Array.from(new Set(change.paths.map(parentDir)));
      await Promise.all(
        parents.map(async (dir) => {
          if (!state.loaded[dir]) return;
          try {
            const children = await batchedInvoke<FsNode[]>('read_dir_children', { path: dir });
            const current = get();
            const parentIndex = current.nodes.findIndex((n) => n.id === dir);
            if (parentIndex === -1) return;
            const parentDepth = current.nodes[parentIndex].depth;
            const adjusted = children.map((c) => ({ ...c, depth: parentDepth + 1 + c.depth }));

            // Remove old direct children (depth == parentDepth+1)
            let end = parentIndex + 1;
            while (end < current.nodes.length && current.nodes[end].depth > parentDepth) {
              end += 1;
            }
            const newNodes = [
              ...current.nodes.slice(0, parentIndex + 1),
              ...adjusted,
              ...current.nodes.slice(end),
            ];
            set({ nodes: newNodes, loaded: { ...current.loaded, [dir]: true } });
          } catch (err) {
            console.error('[IncFileTree] incremental refresh failed', err);
          }
        })
      );
    }
  },
}));

// -----------------------------
// Derived selectors / hooks
// -----------------------------

export function useVisibleFileTree(): FsNode[] {
  return useIncFileTreeStore((state) => {
    const { nodes, expanded } = state;
    const visible: FsNode[] = [];
    let skipDepth: number | null = null;

    for (const node of nodes) {
      if (skipDepth !== null) {
        if (node.depth > skipDepth) {
          // Skip nodes under collapsed directory
          continue;
        }
        // Reached same or shallower depth ⇒ reset
        skipDepth = null;
      }

      visible.push(node);

      if (node.kind === 'dir' && !expanded[node.id]) {
        skipDepth = node.depth;
      }
    }

    return visible;
  });
}

export function useToggleDir() {
  return useIncFileTreeStore((s) => s.toggleDir);
}

export function useLoadIncFileTree(root: string) {
  const loadRoot = useIncFileTreeStore((s) => s.loadRoot);
  useEffect(() => {
    loadRoot(root, INITIAL_DEPTH);
    attachFsListener();
  }, [root, loadRoot]);
}

// -------------- fs watcher --------------
let listenerAttached = false;
let listenEvent: typeof import('@tauri-apps/api/event')['listen'] | undefined;
async function attachFsListener() {
  if (listenerAttached) return;
  listenerAttached = true;
  if (!listenEvent) {
    const mod = await import('@tauri-apps/api/event');
    listenEvent = mod.listen;
  }

  // Listen for granular fs change payloads and apply incrementally
  listenEvent?.<FsChange>('fs:change', (event) => {
    const payload = event.payload as FsChange;
    useIncFileTreeStore.getState().applyFsChange(payload);
  }).catch((err) => console.error('fs:change listener failed', err));
}
