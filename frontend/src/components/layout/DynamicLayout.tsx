import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { paneRegistry } from '../../lib/layout/paneRegistry';
import { templates } from '../../lib/layout/templates';
import type { LayoutNode, PaneId } from '../../lib/layout/types';
import { useSettings } from '../../lib/settings/store';

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
          className={`flex min-w-0 min-h-0 grow-${ratios ? ratios[idx] : 1}`}
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

  const { template, slotToPane } = useMemo(() => {
    const template = templates.find((t) => t.id === activeTemplateId) ?? templates[0];
    const slotToPane: Record<string, ReactElement | null> = {};
    for (const [paneId, slotId] of Object.entries(paneSlotMap)) {
      const element = paneRegistry[paneId as PaneId];
      if (element) slotToPane[slotId] = element;
    }
    return { template, slotToPane };
  }, [activeTemplateId, paneSlotMap]);

  return <div className="flex h-full w-full">{renderNode(template.root, slotToPane)}</div>;
}
