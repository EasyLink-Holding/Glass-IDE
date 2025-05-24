import type { ReactElement } from 'react';
import { templates } from '../../lib/layout/templates';
import type { LayoutNode } from '../../lib/layout/types';
import { useSettings } from '../../lib/settings/store';

import ChatPane from './chat/ChatPane';
// Pane components
import ExplorerPane from './explorer/ExplorerPane';
import MainPane from './main/MainPane';

const paneRegistry: Record<string, ReactElement> = {
  explorer: <ExplorerPane />,
  editor: <MainPane />,
  console: <ChatPane />,
};

function renderNode(
  node: LayoutNode,
  slotToPane: Record<string, ReactElement | null>
): ReactElement {
  if (node.type === 'slot') {
    const content = slotToPane[node.id] ?? null;
    return content ? (
      <div className="flex flex-1 h-full w-full min-w-0 min-h-0">{content}</div>
    ) : (
      <div className="flex flex-1 h-full w-full min-w-0 min-h-0 rounded-lg border border-dashed border-neutral-700" />
    );
  }

  const isRow = node.dir === 'row';
  const ratios = node.ratio && node.ratio.length === node.children.length ? node.ratio : undefined;

  return (
    <div className={`flex ${isRow ? 'flex-row' : 'flex-col'} flex-1 min-w-0 min-h-0 gap-2`}>
      {node.children.map((child, idx) => (
        <div
          key={child.type === 'slot' ? `slot-${child.id}` : `split-${idx}`}
          /*
           * Each split child is wrapped once so we can control its flex-grow ratio.
           * It must also stretch to fill the cross-axis of the parent container
           * and allow shrinking, otherwise nested column/row templates (e.g.
           * "stacked", "two left stacked") will collapse to intrinsic width.
           */
          style={{ flex: ratios ? `${ratios[idx]} 1 0%` : '1 1 0%' }}
          className="flex w-full h-full min-w-0 min-h-0"
        >
          {renderNode(child, slotToPane)}
        </div>
      ))}
    </div>
  );
}

export default function DynamicLayout() {
  const activeTemplateId = useSettings((s) => s.activeTemplateId);
  const paneSlotMap = useSettings((s) => s.paneSlotMap);

  const template = templates.find((t) => t.id === activeTemplateId) ?? templates[0];

  // Build slot -> pane mapping
  const slotToPane: Record<string, ReactElement | null> = {};
  for (const [paneId, slotId] of Object.entries(paneSlotMap)) {
    const element = paneRegistry[paneId];
    if (element) slotToPane[slotId] = element;
  }

  return <div className="flex h-full w-full">{renderNode(template.root, slotToPane)}</div>;
}
