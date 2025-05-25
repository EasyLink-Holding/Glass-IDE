import { memo, useMemo } from 'react';
import { VirtualList } from './VirtualList';

export interface TreeNode {
  id: string;
  name: string;
  depth: number; // 0 = root, 1 = child, etc.
}

interface VirtualTreeProps {
  nodes: TreeNode[];
}

/** Simple virtualised tree that indents rows based on depth. */
function VirtualTreeInner({ nodes }: VirtualTreeProps) {
  return (
    <VirtualList
      items={nodes}
      itemSize={22}
      render={(node) => (
        <div
          className="whitespace-nowrap text-neutral-200 hover:bg-neutral-700/40 px-2"
          style={{ paddingLeft: node.depth * 12 }}
        >
          {node.name}
        </div>
      )}
    />
  );
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
