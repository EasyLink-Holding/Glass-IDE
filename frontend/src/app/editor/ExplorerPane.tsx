import { CaretRight, File as FileIcon } from 'phosphor-react';
/** Left explorer for files/folders */
import { VirtualTree } from '../../components/ui/virtual/VirtualTree';
import type { TreeNode } from '../../components/ui/virtual/VirtualTree';
import {
  useLoadIncFileTree,
  useToggleDir,
  useVisibleFileTree,
} from '../../hooks/useIncrementalFileTree';
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

  const renderRow = (node: TreeNode) => {
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
  };

  return (
    <aside className="flex-1 min-w-0 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900/60 p-1 text-sm">
      <VirtualTree nodes={nodes} render={renderRow} />
    </aside>
  );
}
