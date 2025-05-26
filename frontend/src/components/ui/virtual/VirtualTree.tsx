import { memo, useMemo } from 'react';
import { VirtualList } from './VirtualList';

export interface TreeNode {
  id: string;
  name: string;
  depth: number; // 0 = root, 1 = child, etc.
  /** Optional fs kind – file or dir */
  kind?: 'file' | 'dir';
}

interface VirtualTreeProps {
  nodes: TreeNode[];
  /** Optional custom row renderer */
  render?: (node: TreeNode, index: number) => React.ReactNode;
}

/** Simple virtualised tree that indents rows based on depth. */
function VirtualTreeInner({ nodes, render }: VirtualTreeProps) {
  // Default renderer mirrors the old behaviour
  const defaultRender = (node: TreeNode) => (
    <div
      className="whitespace-nowrap text-neutral-200 hover:bg-neutral-700/40 px-2"
      style={{ paddingLeft: node.depth * 12 }}
    >
      {node.name}
    </div>
  );

  return <VirtualList items={nodes} itemSize={22} render={render ?? defaultRender} />;
}

export const VirtualTree = memo(VirtualTreeInner);

// -----------------------------------------------------------------------------
// Mock generator – useful until real FS layer is ready
// -----------------------------------------------------------------------------

export function useMockTree(count = 5000): TreeNode[] {
  return useMemo(() => {
    const out: TreeNode[] = [];
    for (let i = 0; i < count; i += 1) {
      out.push({ id: `id-${i}`, name: `File_${i}.ts`, depth: i % 5 });
    }
    return out;
  }, [count]);
}
