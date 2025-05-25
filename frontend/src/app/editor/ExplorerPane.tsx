/** Left explorer for files/folders */
import React from 'react';
import { VirtualTree, useMockTree } from '../../components/ui/virtual/VirtualTree';

export default function ExplorerPane() {
  const nodes = useMockTree();
  return (
    <aside className="flex-1 min-w-0 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900/60 p-1 text-sm">
      <VirtualTree nodes={nodes} />
    </aside>
  );
}
