import { useEffect } from 'react';
import { create } from 'zustand';
import { batchedInvoke } from '../lib/tauri/batchedCommunication';

export interface FsNode {
  id: string;
  name: string;
  depth: number;
  kind: 'file' | 'dir';
}

interface FileTreeState {
  nodes: FsNode[];
  load: (root: string, depth: number) => void;
}

export const useFileTreeStore = create<FileTreeState>((set) => ({
  nodes: [],
  load: async (root: string, depth: number) => {
    const nodes = await batchedInvoke<FsNode[]>('read_dir_snapshot', { path: root, depth });
    set({ nodes });
  },
}));

export function useFileTree(root: string, depth = 2): FsNode[] {
  const { nodes, load } = useFileTreeStore();
  useEffect(() => {
    load(root, depth);
  }, [root, depth, load]);
  return nodes;
}
