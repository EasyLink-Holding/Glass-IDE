import type { ReactElement } from 'react';
import { memo, useMemo, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { useWorkspace } from '../../contexts/ViewContext';
import { paneRegistry } from '../../lib/layout/paneRegistry';
import { templates } from '../../lib/layout/templates';
import type { LayoutNode, PaneId } from '../../lib/layout/types';
import { useLayoutStore } from '../../lib/settings/layoutStore';

// Extracted as a separate function for clarity and potential future memoization
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

// Cache wrapper hook – stores rendered node per layout change.
function useRenderNodeWithCache(layoutVersion: string) {
  // Map node.id -> ReactElement
  const cacheRef = useRef<Map<string, ReactElement>>(new Map());

  return (node: LayoutNode, slotToPane: Record<string, ReactElement | null>): ReactElement => {
    if (node.type === 'slot') {
      // Slots are inexpensive – render directly.
      return renderNode(node, slotToPane);
    }

    const key =
      'id' in node
        ? `${layoutVersion}:slot:${node.id}`
        : `${layoutVersion}:split:${node.dir}:${node.children.length}`;
    const cache = cacheRef.current;
    if (cache.has(key)) {
      // We've verified key exists in cache with cache.has, so the result won't be undefined
      const cachedResult = cache.get(key);
      if (cachedResult) return cachedResult;
    }

    const el = renderNode(node, slotToPane);
    cache.set(key, el);
    return el;
  };
}

// The main component that renders the dynamic layout based on current workspace and settings
function DynamicLayout() {
  // Get current view and space to determine which template to use
  const { space } = useWorkspace(); // view not needed for layout

  // Access template and slot settings using the specialized layout store
  // These selectors will only trigger re-renders when the specific values change
  // Select only the slices relevant to the *current* space so we don’t
  // re-render when unrelated spaces are edited.
  const templateId = useLayoutStore((s) => s.spaceTemplateMap[space]);
  const currentPaneSlotMap = useLayoutStore((s) => s.spacePaneSlotMaps[space]);
  const hiddenPanes = useLayoutStore((s) => s.hiddenPanes, shallow);

  const { template, slotToPane, layoutVersion } = useMemo(() => {
    // Get the template
    const template = templates.find((t) => t.id === templateId) ?? templates[0];

    // Incremental version to bust cache when slot map changes
    const layoutVersion = `${space}-${templateId}-${Object.keys(currentPaneSlotMap).join(',')}-${Object.keys(hiddenPanes).join(',')}`;

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

    return { template, slotToPane, layoutVersion };
  }, [space, templateId, currentPaneSlotMap, hiddenPanes]);

  const renderWithCache = useRenderNodeWithCache(layoutVersion);

  return <div className="flex h-full w-full">{renderWithCache(template.root, slotToPane)}</div>;
}

// Export a memoized version of the component to prevent unnecessary re-renders
export default memo(DynamicLayout);
