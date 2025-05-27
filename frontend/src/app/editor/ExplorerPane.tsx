import { CaretRight, File as FileIcon } from 'phosphor-react';
import { useCallback } from 'react';
import { useTabStore } from '../../components/editor/tabStore';
/** Left explorer for files/folders */
import { VirtualTree } from '../../components/ui/virtual/VirtualTree';
import type { TreeNode } from '../../components/ui/virtual/VirtualTree';
import {
  useLoadIncFileTree,
  useToggleDir,
  useVisibleFileTree,
} from '../../hooks/useIncrementalFileTree';
import { batchedInvoke } from '../../lib/tauri/batchedCommunication';
import { memoIcon } from '../../lib/ui/memoIcon';
import { useWorkspaceRoot } from '../../lib/workspace/workspaceStore';

const CaretRightMemo = memoIcon(CaretRight);
const FileMemo = memoIcon(FileIcon);

export default function ExplorerPane() {
  const root = useWorkspaceRoot();

  if (!root) {
    return (
      <aside className="flex-1 min-w-0 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900/60 p-2 text-sm text-neutral-400">
        Open a workspace to view files
      </aside>
    );
  }

  // Load incremental tree once per root
  useLoadIncFileTree(root);

  const nodes = useVisibleFileTree();
  const toggleDir = useToggleDir();
  const openTab = useTabStore((s) => s.openTab);

  const openFile = useCallback(
    async (node: TreeNode) => {
      if (node.kind !== 'file') return;

      // Infer language from extension
      const ext = node.name.split('.').pop()?.toLowerCase() ?? '';
      const langMap: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescript',
        js: 'javascript',
        jsx: 'javascript',
        json: 'json',
        rs: 'rust',
        css: 'css',
        html: 'html',
        md: 'markdown',
        markdown: 'markdown',
      };
      const language = langMap[ext] ?? 'plaintext';

      let code = '';
      try {
        code = await batchedInvoke<string>('read_file_text', { path: node.id });
      } catch (err) {
        console.error('[ExplorerPane] Failed to read file', err);
      }

      openTab({ id: node.id, name: node.name, language, code });
    },
    [openTab]
  );

  // Stable renderer to avoid re-creating function every render and reduce
  // unnecessary VirtualList re-renders.
  const renderRow = useCallback(
    (node: TreeNode) => {
      const isDir = node.kind === 'dir';

      const indent = { paddingLeft: node.depth * 12 } as React.CSSProperties;

      const icon = isDir ? (
        <button
          type="button"
          onClick={() => toggleDir(node.id)}
          // Button element already handles Enter/Space but we still guard for robustness
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleDir(node.id);
            }
          }}
          className="cursor-pointer select-none px-0.5 bg-transparent border-none"
        >
          {/** We'll decide arrow based on expanded */}
          {/* The expanded state is derived from store; as visible nodes skip collapsed children, we can infer expansion by checking if there's a following node deeper */}
          {/** For simplicity we ignore arrow state here – always show right arrow */}
          <CaretRightMemo size={14} weight="bold" />
        </button>
      ) : (
        <span className="px-0.5">
          <FileMemo size={14} weight="regular" />
        </span>
      );

      if (isDir) {
        return (
          <div
            key={node.id}
            className="flex items-center whitespace-nowrap text-neutral-200 hover:bg-neutral-700/40 px-1"
            style={indent}
          >
            {icon}
            <span className="ml-1 select-none overflow-hidden text-ellipsis">{node.name}</span>
          </div>
        );
      }

      return (
        <button
          key={node.id}
          type="button"
          className="flex w-full items-center whitespace-nowrap text-left text-neutral-200 hover:bg-neutral-700/40 px-1 bg-transparent border-none outline-none"
          style={indent}
          onClick={() => openFile(node)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFile(node);
            }
          }}
        >
          {icon}
          <span className="ml-1 select-none overflow-hidden text-ellipsis">{node.name}</span>
        </button>
      );
    },
    [toggleDir, openFile]
  );

  return (
    <aside className="flex-1 min-w-0 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900/60 p-1 text-sm">
      <VirtualTree nodes={nodes} render={renderRow} />
    </aside>
  );
}
