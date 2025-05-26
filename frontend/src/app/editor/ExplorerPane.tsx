/** Left explorer for files/folders */
import { VirtualTree } from '../../components/ui/virtual/VirtualTree';
import { useFileTree } from '../../hooks/useFileTree';
import { useWorkspaceRoot } from '../../lib/workspace/workspaceStore';

export default function ExplorerPane() {
  const root = useWorkspaceRoot();

  if (!root) {
    return (
      <aside className="flex-1 min-w-0 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900/60 p-2 text-sm text-neutral-400">
        Open a workspace to view files
      </aside>
    );
  }

  const nodes = useFileTree(root);
  return (
    <aside className="flex-1 min-w-0 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900/60 p-1 text-sm">
      <VirtualTree nodes={nodes} />
    </aside>
  );
}
