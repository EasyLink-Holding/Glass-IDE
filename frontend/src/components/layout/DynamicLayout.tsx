import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useWorkspace } from '../../contexts/ViewContext';
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
    if (content) {
      return <div className="flex flex-1 h-full w-full min-w-0 min-h-0">{content}</div>;
    }
    // Empty slot placeholder – keep flex sizing but no visual border
    return <div className="flex flex-1 h-full w-full min-w-0 min-h-0" />;
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
  // Get current view and space to determine which template to use
  const { space } = useWorkspace(); // view not needed for layout

  // Access template and slot settings
  const spaceTemplateMap = useSettings((s) => s.spaceTemplateMap);
  const spacePaneSlotMaps = useSettings((s) => s.spacePaneSlotMaps);
  const hiddenPanes = useSettings((s) => s.hiddenPanes);

  const { template, slotToPane } = useMemo(() => {
    // Get the template ID for the current space
    const templateId = spaceTemplateMap[space];

    // Get the template
    const template = templates.find((t) => t.id === templateId) ?? templates[0];

    // Get the pane slot mapping for the current space
    const currentPaneSlotMap = spacePaneSlotMaps[space];

    const slotToPane: Record<string, ReactElement | null> = {};

    // Process each pane mapping, skipping 'none' slots and hidden panes
    for (const [paneId, slotId] of Object.entries(currentPaneSlotMap)) {
      // Skip if slot is 'none' (means don't display this pane in this space)
      if (slotId === 'none') continue;

      // Skip if pane is marked as hidden in settings
      if (hiddenPanes[paneId as PaneId]) continue;

      // Get the React component for this pane
      const Comp = paneRegistry[paneId as PaneId];
      if (Comp) slotToPane[slotId] = <Comp />;
    }

    return { template, slotToPane };
  }, [space, spaceTemplateMap, spacePaneSlotMaps, hiddenPanes]);

  return <div className="flex h-full w-full">{renderNode(template.root, slotToPane)}</div>;
}
